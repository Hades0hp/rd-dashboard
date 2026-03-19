"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
};

type Project = {
  project_id: string;
  name: string;
};

type Objective = {
  objective_id: string;
  project_id: string;
  objective_name: string;
};

type Person = {
  person_id: string;
  name: string;
};

type Timeframe = {
  timeframe_id: string;
  name?: string;
  start_date: string;
  duration_days: number;
  end_date: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [selectedTimeframeId, setSelectedTimeframeId] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedObjectiveId, setSelectedObjectiveId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [
          projectsRes,
          objectivesRes,
          peopleRes,
          timeframesRes,
          activeRes,
        ] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/objectives"),
          fetch("/api/people"),
          fetch("/api/timeframes"),
          fetch("/api/timeframes?mode=active"),
        ]);

        const projectsJson = await projectsRes.json();
        const objectivesJson = await objectivesRes.json();
        const peopleJson = await peopleRes.json();
        const timeframesJson = await timeframesRes.json();
        const activeJson = await activeRes.json();

        setProjects(projectsJson.data || []);
        setObjectives(objectivesJson.data || []);
        setPeople(peopleJson.data || []);
        setTimeframes(timeframesJson.data || []);

        if (activeJson.data?.timeframe_id) {
          setSelectedTimeframeId(activeJson.data.timeframe_id);
        } else if (timeframesJson.data?.length) {
          setSelectedTimeframeId(timeframesJson.data[0].timeframe_id);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadInitialData();
  }, []);

  const selectedTimeframe = useMemo(
    () =>
      timeframes.find((t) => t.timeframe_id === selectedTimeframeId) || null,
    [timeframes, selectedTimeframeId],
  );

  const filteredObjectives = useMemo(() => {
    if (!selectedProjectId) return objectives;
    return objectives.filter((o) => o.project_id === selectedProjectId);
  }, [objectives, selectedProjectId]);

  useEffect(() => {
    async function loadTasks() {
      if (!selectedTimeframe) return;

      setLoading(true);

      try {
        const params = new URLSearchParams({
          start_date: selectedTimeframe.start_date,
          end_date: selectedTimeframe.end_date,
        });

        if (selectedPersonId) params.set("person_id", selectedPersonId);
        if (selectedProjectId) params.set("project_id", selectedProjectId);
        if (selectedObjectiveId)
          params.set("objective_id", selectedObjectiveId);

        const res = await fetch(`/api/tasks?${params.toString()}`);
        const json = await res.json();
        setTasks(json.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [
    selectedTimeframe,
    selectedPersonId,
    selectedProjectId,
    selectedObjectiveId,
  ]);

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    setSelectedObjectiveId("");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Tasks
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                Task Log
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                View and manage tasks logged for the selected sprint/timeframe.
              </p>
            </div>

            <Link
              href="/tasks/new"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              New Task
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Timeframe
              </label>
              <select
                value={selectedTimeframeId}
                onChange={(e) => setSelectedTimeframeId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
              >
                <option value="">Select timeframe</option>
                {timeframes.map((timeframe) => (
                  <option
                    key={timeframe.timeframe_id}
                    value={timeframe.timeframe_id}
                  >
                    {(timeframe.name || timeframe.timeframe_id) +
                      ` (${timeframe.start_date} → ${timeframe.end_date})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Team Member
              </label>
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
              >
                <option value="">All team members</option>
                {people.map((person) => (
                  <option key={person.person_id} value={person.person_id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
              >
                <option value="">All projects</option>
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Objective
              </label>
              <select
                value={selectedObjectiveId}
                onChange={(e) => setSelectedObjectiveId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
              >
                <option value="">All objectives</option>
                {filteredObjectives.map((objective) => (
                  <option
                    key={objective.objective_id}
                    value={objective.objective_id}
                  >
                    {objective.objective_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                      Project
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Hours
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Blocked
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        Loading tasks...
                      </td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        No tasks found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.task_id} className="align-top">
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {task.date}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-900">
                          {task.person_name}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {task.project_name}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {task.objective_name}
                        </td>
                        <td className="max-w-[320px] px-4 py-4 text-sm text-slate-700">
                          <div className="line-clamp-2">{task.description}</div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {task.effort_hours || 0}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {task.blocker_flag ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-4 text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/tasks/${task.task_id}`}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              View
                            </Link>
                            <Link
                              href={`/tasks/${task.task_id}/edit`}
                              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                              Edit
                            </Link>
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
