import { getFilteredTasks } from "@/lib/sheets/tasks";
import { getAllProjects } from "@/lib/sheets/projects";
import { getAllPeople } from "@/lib/sheets/people";
import { getAllObjectives } from "@/lib/sheets/objectives";
import { getAllTimeframes } from "@/lib/sheets/timeframes";
import { getAllBlockers } from "@/lib/sheets/blockers";
import type { PlannedEffortEntry } from "@/lib/types/timeframe";

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

  const selectedTimeframes = timeframes.filter(t =>
    input.timeframe_ids.includes(t.timeframe_id)
  );

  const selectedTimeframeIds = new Set(
  selectedTimeframes.map(t => t.timeframe_id)
  );
  console.log(
  "SELECTED TIMEFRAME IDS",
  [...selectedTimeframeIds]
);

  const ranges = selectedTimeframes.map(t => ({
    start: t.start_date,
    end: t.end_date
  }));

  function inRange(date: string) {
    const d = date.slice(0, 10);
    return ranges.some(r => d >= r.start && d <= r.end);
  }

  // Tasks within the selected timeframe(s)
  const timeframeTasks = allTasks.filter(t => inRange(t.date));

  // Also include "In Progress" tasks from BEFORE the selected timeframe(s)
  // so that unfinished work from previous sprints carries forward
  const earliestStart = ranges.reduce(
    (min, r) => r.start < min ? r.start : min,
    ranges[0]?.start || ""
  );

  const carryForwardTasks = earliestStart
  ? allTasks.filter(t =>
      t.date < earliestStart &&
      ["In Progress", "Blocked"].includes(t.status) &&
      !timeframeTasks.some(tt => tt.task_id === t.task_id)
    )
  : [];

  const tasks = [...timeframeTasks, ...carryForwardTasks];

  // Active blockers shown regardless of timeframe — if a blocker is Open or In Progress
  // it should always appear on the dashboard irrespective of when it was created
  const activeBlockers = blockers.filter(b =>
    ["Open", "In Progress"].includes(b.blocker_status)
  );

  /* ---------------- planned effort from timeframes ---------------- */

  const plannedPctAccum = new Map<string, number[]>();
  // KEY FIX: track which projects have an explicit timeframe entry (even if 0%)
  const projectsWithTimeframeEntry = new Set<string>();

  for (const tf of selectedTimeframes) {
    const entries: PlannedEffortEntry[] = Array.isArray(tf.planned_effort)
      ? tf.planned_effort
      : [];

    for (const entry of entries) {
      if (!entry.project_id) continue;
      const pct = Number(entry.planned_pct);
      if (isNaN(pct)) continue;
      // Mark this project as explicitly set in the timeframe (even if pct === 0)
      projectsWithTimeframeEntry.add(entry.project_id);
      if (!plannedPctAccum.has(entry.project_id)) {
        plannedPctAccum.set(entry.project_id, []);
      }
      plannedPctAccum.get(entry.project_id)!.push(pct);
    }
  }

  const resolvedPlannedPct = new Map<string, number>();
  for (const [pid, pcts] of plannedPctAccum.entries()) {
  const total = pcts.reduce((s, v) => s + v, 0);
  resolvedPlannedPct.set(pid, Number(total.toFixed(1)));
  }

 function getPlannedPct(projectId: string): number | null {
  if (!projectsWithTimeframeEntry.has(projectId)) {
    return null;
  }

  const value = resolvedPlannedPct.get(projectId);

  if (value === undefined || value <= 0) {
    return null;
  }

  return value;
 }

function getEffectiveHours(task: typeof tasks[number]): number {
  const logs = task.effort_hours_log || [];

  // New task in selected timeframe
  const taskCreatedInSelectedTimeframe =
    ranges.some(
      r =>
        task.date >= r.start &&
        task.date <= r.end
    );

  let newTaskHours = 0;

  if (taskCreatedInSelectedTimeframe) {
    if (logs.length === 0) {
      newTaskHours = Number(task.effort_hours || 0);
    } else {
      const loggedTotal = logs.reduce(
        (sum, log) => sum + Number(log.hours || 0),
        0
      );

      newTaskHours = Math.max(
        Number(task.effort_hours || 0) - loggedTotal,
        0
      );
    }
  }

  const sprintHours = logs
    .filter(log =>
      selectedTimeframeIds.has(log.timeframe_id)
    )
    .reduce(
      (sum, log) => sum + Number(log.hours || 0),
      0
    );

  return newTaskHours + sprintHours;
}
  /* ---------------- summary ---------------- */

  const total_tasks = tasks.length;
  const total_hours = tasks.reduce(
  (sum, t) => {
    const hrs = getEffectiveHours(t);

    return sum + hrs;
  },
  0
);
  const active_projects = new Set(tasks.map(t => t.project_id)).size;
  const active_people = new Set(tasks.map(t => t.person_id)).size;
  const insights_count = tasks.filter(t => t.insight?.trim()).length;
  const blockers_count = activeBlockers.length;

  /* ---------------- project effort ---------------- */

  const projectMap = new Map<string, {
    project_id: string;
    project_name: string;
    planned_effort_pct: number | null;
    task_count: number;
    total_hours: number;
  }>();

  // Seed ALL projects — including those with no tasks
  for (const p of projects) {
    projectMap.set(p.project_id, {
      project_id: p.project_id,
      project_name: p.name,
      planned_effort_pct: getPlannedPct(p.project_id),
      task_count: 0,
      total_hours: 0
    });
  }

  // Accumulate task data on top
  for (const t of tasks) {
    const existing = projectMap.get(t.project_id);
    if (existing) {
      existing.task_count++;
      existing.total_hours += getEffectiveHours(t);
    } else {
      projectMap.set(t.project_id, {
        project_id: t.project_id,
        project_name: t.project_name,
        planned_effort_pct: getPlannedPct(t.project_id),
        task_count: 1,
        total_hours: getEffectiveHours(t)
      });
    }
  }

  const project_effort = Array.from(projectMap.values())
    .map(p => {
      const hasActivity = p.task_count > 0;
      const actual = hasActivity && total_hours > 0 && p.total_hours > 0
      ? Number(((p.total_hours / total_hours) * 100).toFixed(1))
      : null;
      // Show planned as null if 0 and not explicitly set in timeframe
      const plannedDisplay = p.planned_effort_pct;
      const gap = actual !== null && plannedDisplay !== null
        ? Number((plannedDisplay - actual).toFixed(1))
        : null;
      return { ...p, planned_effort_pct: plannedDisplay, actual_effort_pct: actual, gap };
    })
    .sort((a, b) => (b.planned_effort_pct ?? -1) - (a.planned_effort_pct ?? -1));


  /* ---------------- objective effort ---------------- */

  const objectiveMap = new Map<string, {
    objective_id: string;
    objective_name: string;
    project_id: string;
    project_name: string;
    task_count: number;
    total_hours: number;
  }>();

  for (const t of tasks) {
    const existing = objectiveMap.get(t.objective_id);
    if (existing) {
      existing.task_count++;
      existing.total_hours += getEffectiveHours(t);
    } else {
      objectiveMap.set(t.objective_id, {
        objective_id: t.objective_id,
        objective_name: t.objective_name,
        project_id: t.project_id,
        project_name: t.project_name,
        task_count: 1,
        total_hours: getEffectiveHours(t)
      });
    }
  }

  const objective_effort = Array.from(objectiveMap.values())
    .map(o => {
      const pct = total_hours > 0 ? (o.total_hours / total_hours) * 100 : 0;
      return { ...o, actual_effort_pct: Number(pct.toFixed(1)) };
    })
   .sort((a, b) => {
  if (b.task_count !== a.task_count) {
    return b.task_count - a.task_count;
  }
  return b.actual_effort_pct - a.actual_effort_pct;
});
  /* ---------------- people contribution ---------------- */

  const peopleMap = new Map<string, {
    person_id: string;
    person_name: string;
    task_count: number;
    total_hours: number;
    blockers_count: number;
    insights_count: number;
  }>();

  for (const t of tasks) {
    const existing = peopleMap.get(t.person_id);
    if (existing) {
      existing.task_count++;
      existing.total_hours += getEffectiveHours(t);
      if (t.insight?.trim()) existing.insights_count++;
    } else {
      peopleMap.set(t.person_id, {
        person_id: t.person_id,
        person_name: t.person_name,
        task_count: 1,
        total_hours: getEffectiveHours(t),
        blockers_count: 0,
        insights_count: t.insight?.trim() ? 1 : 0
      });
    }
  }

  for (const b of activeBlockers) {
    const existing = peopleMap.get(b.person_id);
    if (existing) {
      existing.blockers_count++;
    } else {
      peopleMap.set(b.person_id, {
        person_id: b.person_id,
        person_name: b.person_name,
        task_count: 0,
        total_hours: 0,
        blockers_count: 1,
        insights_count: 0
      });
    }
  }

  const people_contribution = Array.from(peopleMap.values())
    .sort((a, b) => b.total_hours - a.total_hours);

  /* ---------------- blockers ---------------- */

  const blockersData = activeBlockers.map(b => {
    const person = people.find(p => p.person_id === b.person_id);
    const project = projects.find(p => p.project_id === b.project_id);
    const objective = objectives.find(o => o.objective_id === b.objective_id);
    return {
      task_id: b.task_id,
      date: b.created_at,
      person_name: person?.name || b.person_name,
      project_name: project?.name || b.project_name,
      objective_name: objective?.objective_name || b.objective_name,
      blocker_title: b.blocker_title,
      blocker_description: b.blocker_description,
      assigned_to_resolve: b.assigned_to_resolve,
      blocker_status: b.blocker_status
    };
  });

  /* ---------------- insights ---------------- */

  const insights = tasks
    .filter(t => t.insight?.trim())
    .map(t => ({
      task_id: t.task_id,
      date: t.date,
      person_name: t.person_name,
      project_name: t.project_name,
      objective_name: t.objective_name,
      insight: t.insight
    }));

  /* ---------------- all projects for dropdown ---------------- */

  const all_projects = projects.map(p => ({
    project_id: p.project_id,
    project_name: p.name
  }));

  return {
    summary: {
      total_tasks,
      total_hours: Number(total_hours.toFixed(1)),
      active_projects,
      active_people,
      blockers_count,
      insights_count
    },
    project_effort,
    objective_effort,
    people_contribution,
    blockers: blockersData,
    insights,
    all_projects,
    metadata: {
      selected_timeframes_count: selectedTimeframes.length,
      selected_timeframe_names: selectedTimeframes.map(t => t.name),
      objectives_count: objectives.length,
      people_count: people.length,
      projects_count: projects.length
    }
  };
}