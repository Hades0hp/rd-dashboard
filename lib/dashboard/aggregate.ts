import { getFilteredTasks } from "@/lib/sheets/tasks";
import { getAllProjects } from "@/lib/sheets/projects";
import { getAllPeople } from "@/lib/sheets/people";
import { getAllObjectives } from "@/lib/sheets/objectives";
import { getAllTimeframes } from "@/lib/sheets/timeframes";
import { getAllBlockers } from "@/lib/sheets/blockers";

type DashboardInput = {
  timeframe_ids: string[];
};

export async function buildDashboardData(input: DashboardInput) {

  const [
    allTasks,
    projects,
    people,
    objectives,
    timeframes,
    blockers
  ] = await Promise.all([
    getFilteredTasks({}),
    getAllProjects(),
    getAllPeople(),
    getAllObjectives(),
    getAllTimeframes(),
    getAllBlockers()
  ]);


  /* ---------------- timeframe filter ---------------- */

  const selectedTimeframes =
    timeframes.filter(t =>
      input.timeframe_ids.includes(t.timeframe_id)
    );

  const ranges =
    selectedTimeframes.map(t => ({
      start:t.start_date,
      end:t.end_date
    }));


  function inRange(date:string){

    const d = date.slice(0,10);

    return ranges.some(r =>
      d>=r.start && d<=r.end
    );

  }


  const tasks =
    allTasks.filter(t =>
      inRange(t.date)
    );


  const activeBlockers =
    blockers.filter(b =>

      ["Open","In Progress"].includes(b.blocker_status)
      &&
      inRange(b.created_at)

    );


  /* ---------------- summary ---------------- */

  const total_tasks = tasks.length;

  const total_hours =
    tasks.reduce(
      (sum,t)=>sum+(t.effort_hours||0),
      0
    );

  const active_projects =
    new Set(tasks.map(t=>t.project_id)).size;

  const active_people =
    new Set(tasks.map(t=>t.person_id)).size;

  const insights_count =
    tasks.filter(t=>t.insight?.trim()).length;

  const blockers_count =
    activeBlockers.length;


  /* ---------------- project effort ---------------- */

  const projectMap = new Map();

  for(const p of projects){

    projectMap.set(
      p.project_id,
      {
        project_id:p.project_id,
        project_name:p.name,
        planned_effort_pct:p.planned_effort_pct || 0,
        task_count:0,
        total_hours:0
      }
    );

  }


  for(const t of tasks){

    const p =
      projectMap.get(t.project_id)
      ||
      {
        project_id:t.project_id,
        project_name:t.project_name,
        planned_effort_pct:0,
        task_count:0,
        total_hours:0
      };

    p.task_count++;

    p.total_hours +=
      t.effort_hours || 0;

    projectMap.set(
      t.project_id,
      p
    );

  }


  const project_effort =
    Array.from(projectMap.values())
      .filter(p=>p.task_count>0)
      .map(p=>{

        const actual =
          total_hours>0
            ?
            (p.total_hours/total_hours)*100
            :
            0;

        return {

          ...p,

          actual_effort_pct:
            Number(actual.toFixed(1)),

          gap:
            Number(
              (
                p.planned_effort_pct
                -
                actual
              ).toFixed(1)
            )

        };

      })
      .sort(
        (a,b)=>
          b.actual_effort_pct
          -
          a.actual_effort_pct
      );


  /* ---------------- objective effort ---------------- */

  const objectiveMap = new Map();


  for(const t of tasks){

    const o =
      objectiveMap.get(t.objective_id)
      ||
      {
        objective_id:t.objective_id,
        objective_name:t.objective_name,
        project_name:t.project_name,
        task_count:0,
        total_hours:0
      };

    o.task_count++;

    o.total_hours +=
      t.effort_hours || 0;

    objectiveMap.set(
      t.objective_id,
      o
    );

  }


  const objective_effort =
    Array.from(objectiveMap.values())
      .map(o=>{

        const pct =
          total_hours>0
            ?
            (o.total_hours/total_hours)*100
            :
            0;

        return {

          ...o,

          actual_effort_pct:
            Number(pct.toFixed(1))

        };

      })
      .sort(
        (a,b)=>
          b.actual_effort_pct
          -
          a.actual_effort_pct
      );


  /* ---------------- people contribution ---------------- */

  const peopleMap = new Map();


  for(const t of tasks){

    const p =
      peopleMap.get(t.person_id)
      ||
      {
        person_id:t.person_id,
        person_name:t.person_name,
        task_count:0,
        total_hours:0,
        blockers_count:0,
        insights_count:0
      };

    p.task_count++;

    p.total_hours +=
      t.effort_hours || 0;

    if(t.insight?.trim())
      p.insights_count++;

    peopleMap.set(
      t.person_id,
      p
    );

  }


  for(const b of activeBlockers){

    const p =
      peopleMap.get(b.person_id)
      ||
      {
        person_id:b.person_id,
        person_name:b.person_name,
        task_count:0,
        total_hours:0,
        blockers_count:0,
        insights_count:0
      };

    p.blockers_count++;

    peopleMap.set(
      b.person_id,
      p
    );

  }


  const people_contribution =
    Array.from(
      peopleMap.values()
    )
    .sort(
      (a,b)=>
        b.total_hours-a.total_hours
    );


  /* ---------------- blockers ---------------- */

  const blockersData =
    activeBlockers.map(b=>{

      const person =
        people.find(
          p=>p.person_id===b.person_id
        );

      const project =
        projects.find(
          p=>p.project_id===b.project_id
        );

      const objective =
        objectives.find(
          o=>o.objective_id===b.objective_id
        );

      return {

        task_id:b.task_id,

        date:b.created_at,

        person_name:
          person?.name
          ||
          b.person_name,

        project_name:
          project?.name
          ||
          b.project_name,

        objective_name:
          objective?.objective_name
          ||
          b.objective_name,

        blocker_title:
          b.blocker_title,

        blocker_description:
          b.blocker_description,

        assigned_to_resolve:
          b.assigned_to_resolve,

        blocker_status:
          b.blocker_status

      };

    });


  /* ---------------- insights ---------------- */

  const insights =
    tasks
      .filter(t=>t.insight?.trim())
      .map(t=>({

        task_id:t.task_id,

        date:t.date,

        person_name:t.person_name,

        project_name:t.project_name,

        objective_name:t.objective_name,

        insight:t.insight

      }));


  return {

    summary:{
      total_tasks,
      total_hours:Number(total_hours.toFixed(1)),
      active_projects,
      active_people,
      blockers_count,
      insights_count
    },

    project_effort,

    objective_effort,

    people_contribution,

    blockers:blockersData,

    insights,

    metadata:{
      selected_timeframes_count:
        selectedTimeframes.length,

      selected_timeframe_names:
        selectedTimeframes.map(t=>t.name),

      objectives_count:
        objectives.length,

      people_count:
        people.length,

      projects_count:
        projects.length
    }

  };

}