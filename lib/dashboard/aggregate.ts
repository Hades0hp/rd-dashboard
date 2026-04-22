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

  const ranges = selectedTimeframes.map(t => ({
    start: t.start_date,
    end: t.end_date
  }));

  function inRange(date: string) {
    const d = date.slice(0, 10);
    return ranges.some(r => d >= r.start && d <= r.end);
  }

  const tasks = allTasks.filter(t => inRange(t.date));

  const activeBlockers = blockers.filter(b =>
    ["Open", "In Progress"].includes(b.blocker_status) && inRange(b.created_at)
  );

  /* ---------------- planned effort from timeframes ---------------- */
  // Collect all planned_effort entries from selected timeframes
  // keyed by project_id, averaged if multiple timeframes selected

  const plannedPctAccum = new Map<string, number[]>();

  for (const tf of selectedTimeframes) {
    const entries: PlannedEffortEntry[] = Array.isArray(tf.planned_effort)
      ? tf.planned_effort
      : [];

    for (const entry of entries) {
      const pct = Number(entry.planned_pct);
      if (!isNaN(pct) && entry.project_id) {
        if (!plannedPctAccum.has(entry.project_id)) {
          plannedPctAccum.set(entry.project_id, []);
        }
        plannedPctAccum.get(entry.project_id)!.push(pct);
      }
    }
  }

  // Average across selected timeframes
  const resolvedPlannedPct = new Map<string, number>();
  for (const [pid, pcts] of plannedPctAccum.entries()) {
    const avg = pcts.reduce((s, v) => s + v, 0) / pcts.length;
    resolvedPlannedPct.set(pid, Number(avg.toFixed(1)));
  }

  // Get planned pct: timeframe value takes priority, fall back to project default
  function getPlannedPct(projectId: string, fallback: number): number {
    if (resolvedPlannedPct.has(projectId)) {
      return resolvedPlannedPct.get(projectId)!;
    }
    return Number(fallback) || 0;
  }

  /* ---------------- summary ---------------- */

  const total_tasks = tasks.length;
  const total_hours = tasks.reduce((sum, t) => sum + (t.effort_hours || 0), 0);
  const active_projects = new Set(tasks.map(t => t.project_id)).size;
  const active_people = new Set(tasks.map(t => t.person_id)).size;
  const insights_count = tasks.filter(t => t.insight?.trim()).length;
  const blockers_count = activeBlockers.length;

  /* ---------------- project effort ---------------- */

  const projectMap = new Map<string, {
    project_id: string;
    project_name: string;
    planned_effort_pct: number;
    task_count: number;
    total_hours: number;
  }>();

  // Seed ALL projects
  for (const p of projects) {
    projectMap.set(p.project_id, {
      project_id: p.project_id,
      project_name: p.name,
      planned_effort_pct: getPlannedPct(p.project_id, p.planned_effort_pct ?? 0),
      task_count: 0,
      total_hours: 0
    });
  }

  // Accumulate task data
  for (const t of tasks) {
    const existing = projectMap.get(t.project_id);
    if (existing) {
      existing.task_count++;
      existing.total_hours += t.effort_hours || 0;
    } else {
      projectMap.set(t.project_id, {
        project_id: t.project_id,
        project_name: t.project_name,
        planned_effort_pct: getPlannedPct(t.project_id, 0),
        task_count: 1,
        total_hours: t.effort_hours || 0
      });
    }
  }

  const project_effort = Array.from(projectMap.values())
    .filter(p => p.task_count > 0)
    .map(p => {
      const actual = total_hours > 0 ? (p.total_hours / total_hours) * 100 : 0;
      return {
        ...p,
        actual_effort_pct: Number(actual.toFixed(1)),
        gap: Number((p.planned_effort_pct - actual).toFixed(1))
      };
    })
    .sort((a, b) => b.actual_effort_pct - a.actual_effort_pct);

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
      existing.total_hours += t.effort_hours || 0;
    } else {
      objectiveMap.set(t.objective_id, {
        objective_id: t.objective_id,
        objective_name: t.objective_name,
        project_id: t.project_id,
        project_name: t.project_name,
        task_count: 1,
        total_hours: t.effort_hours || 0
      });
    }
  }

  const objective_effort = Array.from(objectiveMap.values())
    .map(o => {
      const pct = total_hours > 0 ? (o.total_hours / total_hours) * 100 : 0;
      return { ...o, actual_effort_pct: Number(pct.toFixed(1)) };
    })
    .sort((a, b) => b.actual_effort_pct - a.actual_effort_pct);

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
      existing.total_hours += t.effort_hours || 0;
      if (t.insight?.trim()) existing.insights_count++;
    } else {
      peopleMap.set(t.person_id, {
        person_id: t.person_id,
        person_name: t.person_name,
        task_count: 1,
        total_hours: t.effort_hours || 0,
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