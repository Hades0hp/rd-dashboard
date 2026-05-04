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
  task_type: string;
  status: string;
  effort_hours: number;
  blocker_flag: boolean;
};

type Timeframe = {
  timeframe_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status?: string;
};

type OptionItem = {
  id: string;
  name: string;
};

type ObjectiveOption = {
  id: string;
  name: string;
  project_id: string;
  project_name: string;
};

function truncateText(text: string, max = 44) {
  if (!text) return "-";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function formatTimeframeLabel(tf: Timeframe) {
  return `${tf.name} (${tf.start_date} → ${tf.end_date})`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Done") {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
        Done
      </span>
    );
  }
  if (status === "In Progress") {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
        In Progress
      </span>
    );
  }
  if (status === "Blocked") {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        Blocked
      </span>
    );
  }
  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
      {status}
    </span>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTimeframeId, setSelectedTimeframeId] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState("ALL");
  const [selectedObjectiveId, setSelectedObjectiveId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksRes, timeframesRes] = await Promise.all([
          fetch("/api/tasks", { cache: "no-store" }),
          fetch("/api/timeframes", { cache: "no-store" }),
        ]);

        const tasksJson = await tasksRes.json();
        const timeframesJson = await timeframesRes.json();

        const loadedTasks = tasksJson?.data || [];
        const loadedTimeframes = timeframesJson?.data || [];

        setTasks(loadedTasks);
        setTimeframes(loadedTimeframes);

        const activeTimeframe =
          loadedTimeframes.find((tf: Timeframe) => tf.status === "Active") ||
          loadedTimeframes[0];

        if (activeTimeframe) {
          setSelectedTimeframeId(activeTimeframe.timeframe_id);
        }
      } catch (error) {
        console.error("Error loading tasks page:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const selectedTimeframe = useMemo(
    () => timeframes.find((tf) => tf.timeframe_id === selectedTimeframeId) || null,
    [timeframes, selectedTimeframeId],
  );

  const peopleOptions = useMemo<OptionItem[]>(() => {
    const map = new Map<string, string>();
    tasks.forEach((task) => {
      if (task.person_id && task.person_name) map.set(task.person_id, task.person_name);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const projectOptions = useMemo<OptionItem[]>(() => {
    const map = new Map<string, string>();
    tasks.forEach((task) => {
      if (task.project_id && task.project_name) map.set(task.project_id, task.project_name);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  // Objectives filtered by selected project, deduplicated by name when all projects shown
  const objectiveOptions = useMemo<ObjectiveOption[]>(() => {
    const map = new Map<string, ObjectiveOption>();
    tasks.forEach((task) => {
      if (task.objective_id && task.objective_name) {
        map.set(task.objective_id, {
          id: task.objective_id,
          name: task.objective_name,
          project_id: task.project_id,
          project_name: task.project_name,
        });
      }
    });

    let options = Array.from(map.values());

    // Filter by selected project
    if (selectedProjectId !== "ALL") {
      options = options.filter((o) => o.project_id === selectedProjectId);
    } else {
      // Deduplicate by objective name when all projects selected
      const seenNames = new Set<string>();
      options = options.filter((o) => {
        if (seenNames.has(o.name)) return false;
        seenNames.add(o.name);
        return true;
      });
    }

    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, selectedProjectId]);

  // Reset objective when project changes
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedObjectiveId("ALL");
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesTimeframe = selectedTimeframe
        ? task.date >= selectedTimeframe.start_date && task.date <= selectedTimeframe.end_date
        : true;
      const matchesPerson = selectedPersonId === "ALL" || task.person_id === selectedPersonId;
      const matchesProject = selectedProjectId === "ALL" || task.project_id === selectedProjectId;
      const matchesObjective = selectedObjectiveId === "ALL" || task.objective_id === selectedObjectiveId;
      const matchesStatus = selectedStatus === "ALL" || task.status === selectedStatus;
      return matchesTimeframe && matchesPerson && matchesProject && matchesObjective && matchesStatus;
    });
  }, [tasks, selectedTimeframe, selectedPersonId, selectedProjectId, selectedObjectiveId, selectedStatus]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1500px] px-8 py-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">Task Log</h1>
            <p className="mt-2 text-sm text-slate-500">
              View and manage tasks logged for the selected sprint/timeframe.
            </p>
          </div>
          <Link
            href="/tasks/new"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-base font-semibold text-white"
          >
            New Task
          </Link>
        </div>

        {/* Filters card */}
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Timeframe</label>
              <select
                value={selectedTimeframeId}
                onChange={(e) => setSelectedTimeframeId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
              >
                {timeframes.map((tf) => (
                  <option key={tf.timeframe_id} value={tf.timeframe_id}>
                    {formatTimeframeLabel(tf)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Team Member</label>
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
              >
                <option value="ALL">All team members</option>
                {peopleOptions.map((person) => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
              >
                <option value="ALL">All projects</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Objective</label>
              <select
                value={selectedObjectiveId}
                onChange={(e) => setSelectedObjectiveId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
              >
                <option value="ALL">All objectives</option>
                {objectiveOptions.map((objective) => (
                  <option key={objective.id} value={objective.id}>
                    {objective.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="Done">Done</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table card */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No tasks found for the selected filters.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Person</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Objective</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Hours</th>
                  <th className="px-5 py-3">Blocked</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.task_id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4 align-top text-sm text-slate-900">{task.date}</td>
                    <td className="px-5 py-4 align-top text-sm text-slate-900">{task.person_name}</td>
                    <td className="px-5 py-4 align-top text-sm text-slate-900">{task.project_name}</td>
                    <td className="px-5 py-4 align-top text-sm text-slate-900">{task.objective_name}</td>
                    <td className="px-5 py-4 align-top text-sm text-slate-900">{truncateText(task.description)}</td>
                    <td className="px-5 py-4 align-top">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-slate-900">{task.effort_hours}</td>
                    <td className="px-5 py-4 align-top text-sm text-slate-900">
                      {task.blocker_flag ? "Yes" : "No"}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/tasks/${task.task_id}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </Link>
                        <Link
                          href={`/tasks/${task.task_id}/edit`}
                          className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  );
}