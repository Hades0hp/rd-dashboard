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

type Objective = {
  objective_id: string;
  project_id: string;
  objective_name: string;
};

type Task = {
  task_id: string;
  date: string;
  person_id: string;
  person_name: string;
  project_id: string;
  project_name: string;
  objective_id: string;
  objective_name: string;
  description: string;
  status: string;
  effort_hours?: number;
  blocker_flag: boolean;
  blocker_description?: string;
  insight?: string;
};

type Timeframe = {
  timeframe_id: string;
  name?: string;
  start_date: string;
  duration_days: number;
  end_date: string;
};

function priorityBadge(priority?: string) {
  if (priority === "High") return "bg-rose-100 text-rose-700";
  if (priority === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function statusBadge(status: string) {
  if (status === "Active") return "bg-emerald-100 text-emerald-700";
  if (status === "Paused") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params;
      const id = resolvedParams.id;
      setProjectId(id);

      try {
        const [projectRes, objectivesRes, timeframeRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch(`/api/objectives?project_id=${id}`),
          fetch(`/api/timeframes?mode=active`),
        ]);

        const projectJson = await projectRes.json();
        const objectivesJson = await objectivesRes.json();
        const timeframeJson = await timeframeRes.json();

        if (!projectJson.success || !projectJson.data) {
          setLoading(false);
          return;
        }

        setProject(projectJson.data);
        setObjectives(objectivesJson.data || []);
        setTimeframe(timeframeJson.data || null);

        if (timeframeJson.data) {
          const { start_date, end_date } = timeframeJson.data;
          const tasksRes = await fetch(
            `/api/tasks?project_id=${id}&start_date=${start_date}&end_date=${end_date}`,
          );
          const tasksJson = await tasksRes.json();
          setTasks(tasksJson.data || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params]);

  const contributionByPerson = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; hours: number }
    >();

    for (const task of tasks) {
      const existing = map.get(task.person_id) || {
        name: task.person_name,
        count: 0,
        hours: 0,
      };

      existing.count += 1;
      existing.hours += task.effort_hours || 0;

      map.set(task.person_id, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [tasks]);

  const blockerTasks = useMemo(
    () => tasks.filter((task) => task.blocker_flag),
    [tasks],
  );

  const insights = useMemo(
    () => tasks.filter((task) => task.insight && task.insight.trim()),
    [tasks],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow">
            <p className="text-sm text-slate-500">Loading project...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow">
            <p className="text-sm text-rose-600">Project not found.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Project Detail
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              {project.name}
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Project summary, objectives, task activity, blockers, and
              insights.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/projects"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Projects
            </Link>
            <Link
              href={`/projects/${projectId}/edit`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Edit Project
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityBadge(
                    project.priority,
                  )}`}
                >
                  {project.priority || "Low"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(
                    project.status,
                  )}`}
                >
                  {project.status}
                </span>
                {timeframe && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {timeframe.name || timeframe.timeframe_id}:{" "}
                    {timeframe.start_date} → {timeframe.end_date}
                  </span>
                )}
              </div>

              <h2 className="mt-6 text-2xl font-semibold text-slate-950">
                Objective
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {project.objective || "-"}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Planned Effort
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {project.planned_effort_pct ?? 0}%
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Progress
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {project.progress_pct ?? 0}%
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Objectives
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {objectives.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tasks in Timeframe
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {tasks.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-semibold text-slate-950">
                Objectives
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Predefined objectives under this project.
              </p>

              <div className="mt-6 space-y-3">
                {objectives.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    No objectives found for this project.
                  </div>
                ) : (
                  objectives.map((objective) => (
                    <div
                      key={objective.objective_id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="text-sm font-medium text-slate-900">
                        {objective.objective_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {objective.objective_id}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-semibold text-slate-950">
                Tasks in Active Timeframe
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Recent work logged under this project for the selected active
                timeframe.
              </p>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Person
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Objective
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {tasks.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-sm text-slate-500"
                          >
                            No tasks found for the active timeframe.
                          </td>
                        </tr>
                      ) : (
                        tasks.map((task) => (
                          <tr key={task.task_id}>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              {task.date}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-900">
                              {task.person_name}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              {task.objective_name}
                            </td>
                            <td className="max-w-[360px] px-4 py-4 text-sm text-slate-700">
                              <div className="line-clamp-2">
                                {task.description}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              {task.status}
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

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-semibold text-slate-950">
                People Contribution
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Team members contributing in the active timeframe.
              </p>

              <div className="mt-6 space-y-3">
                {contributionByPerson.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    No contributors found.
                  </div>
                ) : (
                  contributionByPerson.map((person) => (
                    <div
                      key={person.name}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {person.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {person.count} task(s)
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {person.hours}h
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-semibold text-slate-950">
                Blockers
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Tasks flagged as blocked in the active timeframe.
              </p>

              <div className="mt-6 space-y-3">
                {blockerTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    No blockers found.
                  </div>
                ) : (
                  blockerTasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
                    >
                      <div className="text-sm font-medium text-slate-900">
                        {task.person_name} • {task.objective_name}
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        {task.blocker_description || task.description}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-semibold text-slate-950">
                Insights
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Learnings captured from recent work.
              </p>

              <div className="mt-6 space-y-3">
                {insights.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    No insights logged.
                  </div>
                ) : (
                  insights.map((task) => (
                    <div
                      key={task.task_id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="text-sm font-medium text-slate-900">
                        {task.person_name} • {task.objective_name}
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        {task.insight}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
