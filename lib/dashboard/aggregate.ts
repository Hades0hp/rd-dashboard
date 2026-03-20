import { getFilteredTasks } from "@/lib/sheets/tasks";
import { getAllProjects } from "@/lib/sheets/projects";
import { getAllPeople } from "@/lib/sheets/people";
import { getAllObjectives } from "@/lib/sheets/objectives";

type DashboardInput = {
  start_date: string;
  end_date: string;
};

export async function buildDashboardData(input: DashboardInput) {
  const [tasks, projects, people, objectives] = await Promise.all([
    getFilteredTasks({
      start_date: input.start_date,
      end_date: input.end_date,
    }),
    getAllProjects(),
    getAllPeople(),
    getAllObjectives(),
  ]);

  const totalTasks = tasks.length;
  const totalHours = tasks.reduce(
    (sum, task) => sum + (task.effort_hours || 0),
    0,
  );

  const activeProjects = new Set(tasks.map((task) => task.project_id)).size;
  const activePeople = new Set(tasks.map((task) => task.person_id)).size;
  const blockersCount = tasks.filter((task) => task.blocker_flag).length;
  const insightsCount = tasks.filter(
    (task) => task.insight && task.insight.trim(),
  ).length;

  const projectEffortMap = new Map<
    string,
    {
      project_id: string;
      project_name: string;
      task_count: number;
      total_hours: number;
      planned_effort_pct: number;
    }
  >();

  for (const project of projects) {
    projectEffortMap.set(project.project_id, {
      project_id: project.project_id,
      project_name: project.name,
      task_count: 0,
      total_hours: 0,
      planned_effort_pct: project.planned_effort_pct ?? 0,
    });
  }

  for (const task of tasks) {
    const existing = projectEffortMap.get(task.project_id) || {
      project_id: task.project_id,
      project_name: task.project_name,
      task_count: 0,
      total_hours: 0,
      planned_effort_pct: 0,
    };

    existing.task_count += 1;
    existing.total_hours += task.effort_hours || 0;

    projectEffortMap.set(task.project_id, existing);
  }

  const projectEffort = Array.from(projectEffortMap.values())
    .filter((item) => item.task_count > 0 || item.total_hours > 0)
    .map((item) => {
      const actual_effort_pct =
        totalHours > 0
          ? Number(((item.total_hours / totalHours) * 100).toFixed(1))
          : totalTasks > 0
            ? Number(((item.task_count / totalTasks) * 100).toFixed(1))
            : 0;

      return {
        project_id: item.project_id,
        project_name: item.project_name,
        task_count: item.task_count,
        total_hours: item.total_hours,
        planned_effort_pct: item.planned_effort_pct,
        actual_effort_pct,
        gap: Number((item.planned_effort_pct - actual_effort_pct).toFixed(1)),
      };
    })
    .sort((a, b) => b.actual_effort_pct - a.actual_effort_pct);

  const objectiveEffortMap = new Map<
    string,
    {
      objective_id: string;
      objective_name: string;
      project_name: string;
      task_count: number;
      total_hours: number;
    }
  >();

  for (const task of tasks) {
    const existing = objectiveEffortMap.get(task.objective_id) || {
      objective_id: task.objective_id,
      objective_name: task.objective_name,
      project_name: task.project_name,
      task_count: 0,
      total_hours: 0,
    };

    existing.task_count += 1;
    existing.total_hours += task.effort_hours || 0;

    objectiveEffortMap.set(task.objective_id, existing);
  }

  const objectiveEffort = Array.from(objectiveEffortMap.values())
    .map((item) => {
      const actual_effort_pct =
        totalHours > 0
          ? Number(((item.total_hours / totalHours) * 100).toFixed(1))
          : totalTasks > 0
            ? Number(((item.task_count / totalTasks) * 100).toFixed(1))
            : 0;

      return {
        ...item,
        actual_effort_pct,
      };
    })
    .sort((a, b) => b.actual_effort_pct - a.actual_effort_pct);

  const peopleContributionMap = new Map<
    string,
    {
      person_id: string;
      person_name: string;
      task_count: number;
      total_hours: number;
      blockers_count: number;
      insights_count: number;
    }
  >();

  for (const task of tasks) {
    const existing = peopleContributionMap.get(task.person_id) || {
      person_id: task.person_id,
      person_name: task.person_name,
      task_count: 0,
      total_hours: 0,
      blockers_count: 0,
      insights_count: 0,
    };

    existing.task_count += 1;
    existing.total_hours += task.effort_hours || 0;
    if (task.blocker_flag) existing.blockers_count += 1;
    if (task.insight && task.insight.trim()) existing.insights_count += 1;

    peopleContributionMap.set(task.person_id, existing);
  }

  const peopleContribution = Array.from(peopleContributionMap.values()).sort(
    (a, b) => b.task_count - a.task_count,
  );

  const blockers = tasks
    .filter((task) => task.blocker_flag)
    .map((task) => ({
      task_id: task.task_id,
      date: task.date,
      person_name: task.person_name,
      project_name: task.project_name,
      objective_name: task.objective_name,
      blocker_description: task.blocker_description || task.description,
    }));

  const insights = tasks
    .filter((task) => task.insight && task.insight.trim())
    .map((task) => ({
      task_id: task.task_id,
      date: task.date,
      person_name: task.person_name,
      project_name: task.project_name,
      objective_name: task.objective_name,
      insight: task.insight,
    }));

  return {
    summary: {
      total_tasks: totalTasks,
      total_hours: Number(totalHours.toFixed(1)),
      active_projects: activeProjects,
      active_people: activePeople,
      blockers_count: blockersCount,
      insights_count: insightsCount,
    },
    project_effort: projectEffort,
    objective_effort: objectiveEffort,
    people_contribution: peopleContribution,
    blockers,
    insights,
    metadata: {
      start_date: input.start_date,
      end_date: input.end_date,
      objectives_count: objectives.length,
      people_count: people.length,
      projects_count: projects.length,
    },
  };
}
