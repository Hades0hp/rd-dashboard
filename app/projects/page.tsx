"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Project = {
  project_id: string;
  name: string;
  objective?: string;
  priority?: "High" | "Medium" | "Low";
  planned_effort_pct?: number;
  status: "Active" | "Paused" | "Archived";
  progress_pct?: number;
};

type Task = {
  task_id: string;
  project_id: string;
  status: string;
  date: string;
  effort_hours?: number;
};

type TimeframePlannedEffort = {
  project_id: string;
  project_name: string;
  planned_pct: number;
};

type Timeframe = {
  timeframe_id: string;
  name?: string;
  start_date: string;
  end_date: string;
  planned_effort?: TimeframePlannedEffort[];
};

function derivePriority(plannedPct: number): "High" | "Medium" | "Low" {
  if (plannedPct >= 30) return "High";
  if (plannedPct >= 10) return "Medium";
  return "Low";
}

function priorityBadge(priority: string) {
  if (priority === "High") return "bg-rose-100 text-rose-700";
  if (priority === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function statusBadge(status: string) {
  if (status === "Active") return "bg-emerald-100 text-emerald-700";
  if (status === "Paused") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-700 transition-all"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span>{value}%</span>
    </div>
  );
}

export default function ProjectsPage() {
  const [baseProjects, setBaseProjects] = useState<Project[]>([]);
  const [allTimeframes, setAllTimeframes] = useState<Timeframe[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
 const [selectedTimeframeId, setSelectedTimeframeId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [projectsRes, timeframesRes, tasksRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/timeframes"),
          fetch("/api/tasks"),
        ]);

        const projectsJson = await projectsRes.json();
        const timeframesJson = await timeframesRes.json();
        const tasksJson = await tasksRes.json();

        const loadedProjects: Project[] = projectsJson.data || [];
        const loadedTimeframes: Timeframe[] = timeframesJson.data || [];
        const loadedTasks: Task[] = tasksJson.data || [];

        setBaseProjects(loadedProjects);
        setAllTimeframes(loadedTimeframes);
        setAllTasks(loadedTasks);

        // Default to active timeframe
        const today = new Date().toISOString().slice(0, 10);
        const active = loadedTimeframes.find(
          (t) => t.start_date <= today && t.end_date >= today,
        );
        if (active) {
          setSelectedTimeframeId(active.timeframe_id);
        } else if (loadedTimeframes.length > 0) {
          setSelectedTimeframeId(loadedTimeframes[0].timeframe_id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  const selectedTimeframe = useMemo(
    () => allTimeframes.find((t) => t.timeframe_id === selectedTimeframeId) ?? null,
    [allTimeframes, selectedTimeframeId],
  );

  const enrichedProjects = useMemo(() => {
    if (baseProjects.length === 0) return [];

    if (selectedTimeframeId === "ALL") {
      const plannedSumMap = new Map<string, number>();
      const plannedCountMap = new Map<string, number>();

      allTimeframes.forEach((tf) => {
        if (!tf.planned_effort || tf.planned_effort.length === 0) return;
        tf.planned_effort.forEach((e) => {
          plannedSumMap.set(e.project_id, (plannedSumMap.get(e.project_id) ?? 0) + e.planned_pct);
          plannedCountMap.set(e.project_id, (plannedCountMap.get(e.project_id) ?? 0) + 1);
        });
      });

      const tasksByProject = new Map<string, Task[]>();
      allTasks.forEach((task) => {
        const existing = tasksByProject.get(task.project_id) || [];
        tasksByProject.set(task.project_id, [...existing, task]);
      });

      return baseProjects.map((project) => {
        const sum = plannedSumMap.get(project.project_id) ?? 0;
        const count = plannedCountMap.get(project.project_id) ?? 0;
        const plannedPct = count > 0
          ? Math.round(sum / count)
          : (project.planned_effort_pct ?? 0);

        const projectTasks = tasksByProject.get(project.project_id) || [];
        const doneHours = projectTasks
          .filter((t) => t.status === "Done")
          .reduce((sum, t) => sum + (t.effort_hours || 0), 0);
        const totalHours = projectTasks
          .reduce((sum, t) => sum + (t.effort_hours || 0), 0);
        const progressPct = totalHours > 0
          ? Math.round((doneHours / totalHours) * 100)
          : 0;

        return {
          ...project,
          planned_effort_pct: plannedPct,
          // null means "not set in any timeframe" — show — in UI
          planned_effort_pct_display: count > 0 ? plannedPct : null,
          progress_pct: progressPct,
          priority: derivePriority(plannedPct),
        };
      }).sort((a, b) => (b.planned_effort_pct ?? 0) - (a.planned_effort_pct ?? 0));
    }

    // Specific timeframe — build map of explicitly set projects
    const plannedEffortMap = new Map<string, number>();
    (selectedTimeframe?.planned_effort || []).forEach((e) => {
      plannedEffortMap.set(e.project_id, e.planned_pct);
    });

    const start = selectedTimeframe?.start_date ?? "";
    const end = selectedTimeframe?.end_date ?? "";

    const tasksByProject = new Map<string, Task[]>();
    allTasks
      .filter((t) => t.date >= start && t.date <= end)
      .forEach((task) => {
        const existing = tasksByProject.get(task.project_id) || [];
        tasksByProject.set(task.project_id, [...existing, task]);
      });

    return baseProjects.map((project) => {
      // If project is in the timeframe's planned_effort (even as 0), use that value
      // If not set at all in this timeframe, show — (null)
      const inTimeframe = plannedEffortMap.has(project.project_id);
      const plannedPct = inTimeframe
        ? plannedEffortMap.get(project.project_id)!
        : 0;
      const plannedPctDisplay = inTimeframe
        ? plannedEffortMap.get(project.project_id)!
        : null;

      const projectTasks = tasksByProject.get(project.project_id) || [];
      const doneHours = projectTasks
        .filter((t) => t.status === "Done")
        .reduce((sum, t) => sum + (t.effort_hours || 0), 0);
      const totalHours = projectTasks
        .reduce((sum, t) => sum + (t.effort_hours || 0), 0);
      const progressPct = totalHours > 0
        ? Math.round((doneHours / totalHours) * 100)
        : 0;

      return {
        ...project,
        planned_effort_pct: plannedPct,
        planned_effort_pct_display: plannedPctDisplay,
        progress_pct: progressPct,
        priority: derivePriority(plannedPct),
      };
    }).sort((a, b) => (b.planned_effort_pct ?? 0) - (a.planned_effort_pct ?? 0));
  }, [baseProjects, allTimeframes, allTasks, selectedTimeframeId, selectedTimeframe]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Projects
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Projects
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Manage project definitions, priorities, effort expectations, and progress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedTimeframeId}
              onChange={(e) => setSelectedTimeframeId(e.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
            >
              <option value="ALL">All Timeframes</option>
              {allTimeframes.map((tf) => (
                <option key={tf.timeframe_id} value={tf.timeframe_id}>
                  {tf.name || tf.timeframe_id}
                </option>
              ))}
            </select>

            <Link
              href="/projects/new"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              New Project
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Objective</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Planned Effort %</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Progress %</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Loading projects...</td>
                    </tr>
                  ) : enrichedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">No projects found.</td>
                    </tr>
                  ) : (
                    enrichedProjects.map((project) => (
                      <tr key={project.project_id} className="align-top">
                        <td className="px-4 py-4 text-sm font-medium text-slate-900">{project.name}</td>
                        <td className="max-w-[320px] px-4 py-4 text-sm text-slate-700">
                          <div className="line-clamp-2 cursor-default" title={project.objective || ""}>
                            {project.objective || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityBadge(project.priority ?? "Low")}`}>
                            {project.priority ?? "Low"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {project.planned_effort_pct_display !== null && project.planned_effort_pct_display !== undefined
                            ? `${project.planned_effort_pct_display}%`
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          <ProgressBar value={project.progress_pct ?? 0} />
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(project.status)}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <Link href={`/projects/${project.project_id}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">View</Link>
                            <Link href={`/projects/${project.project_id}/edit`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800">Edit</Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}