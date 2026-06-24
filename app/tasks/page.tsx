"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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
  created_at?: string;
  updated_at?: string;
  effort_hours_log?: {
  timeframe_id: string;
  hours: number;
}[];
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

function TasksPageInner() {
  const searchParams = useSearchParams();
  const STORAGE_KEY = "tasks_filters";
  const pathname = usePathname();

  // Clear saved filters when user navigates away from /tasks/* to another module
  useEffect(() => {
    return () => {
      // This runs on unmount (when navigating away)
      try {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith("/tasks")) {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch {}
    };
  }, []);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTimeframeId, setSelectedTimeframeId] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState("ALL");
  const [selectedObjectiveId, setSelectedObjectiveId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  function persistFilters(updates: Record<string, string>) {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      const current = saved ? JSON.parse(saved) : {};
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...updates }));
    } catch {}
  }

  useEffect(() => {
    // Restore filters from sessionStorage on mount
    // URL param (person_id from dashboard) takes priority over saved filters
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      const filters = saved ? JSON.parse(saved) : {};
      const urlPersonId = searchParams.get("person_id");

      if (urlPersonId) {
        setSelectedPersonId(urlPersonId);
        persistFilters({ person_id: urlPersonId });
      } else if (filters.person_id) {
        setSelectedPersonId(filters.person_id);
      }

      if (filters.project_id) setSelectedProjectId(filters.project_id);
      if (filters.objective_id) setSelectedObjectiveId(filters.objective_id);
      if (filters.status) setSelectedStatus(filters.status);
      if (filters.timeframe_id) setSelectedTimeframeId(filters.timeframe_id);
    } catch {}
  }, []);

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

        // Only set default timeframe if none saved
        try {
          const saved = sessionStorage.getItem(STORAGE_KEY);
          const filters = saved ? JSON.parse(saved) : {};
          if (!filters.timeframe_id) {
            const activeTimeframe =
              loadedTimeframes.find((tf: Timeframe) => tf.status === "Active") ||
              loadedTimeframes[0];
            if (activeTimeframe) {
              setSelectedTimeframeId(activeTimeframe.timeframe_id);
              persistFilters({ timeframe_id: activeTimeframe.timeframe_id });
            }
          }
        } catch {}
      } catch (error) {
        console.error("Error loading tasks page:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const selectedTimeframe = useMemo(
    () => selectedTimeframeId === "ALL"
      ? null
      : timeframes.find((tf) => tf.timeframe_id === selectedTimeframeId) || null,
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

    if (selectedProjectId !== "ALL") {
      options = options.filter((o) => o.project_id === selectedProjectId);
    } else {
      const seenNames = new Set<string>();
      options = options.filter((o) => {
        if (seenNames.has(o.name)) return false;
        seenNames.add(o.name);
        return true;
      });
    }

    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, selectedProjectId]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedObjectiveId("ALL");
    persistFilters({ project_id: projectId, objective_id: "ALL" });
  };

  const filteredTasks = useMemo(() => {
    // Tasks within the selected timeframe
   const timeframeTasks = tasks.filter((task) => {

  const effectiveDate =
    task.status === "Done"
      ? (task.updated_at || task.date).slice(0, 10)
      : task.date;

  const matchesTimeframe = selectedTimeframe
    ? effectiveDate >= selectedTimeframe.start_date &&
      effectiveDate <= selectedTimeframe.end_date
    : true;

  const matchesPerson =
    selectedPersonId === "ALL" ||
    task.person_id === selectedPersonId;

  const matchesProject =
    selectedProjectId === "ALL" ||
    task.project_id === selectedProjectId;

  const matchesObjective =
    selectedObjectiveId === "ALL" ||
    task.objective_id === selectedObjectiveId;

  const matchesStatus =
    selectedStatus === "ALL" ||
    task.status === selectedStatus;

  return (
    matchesTimeframe &&
    matchesPerson &&
    matchesProject &&
    matchesObjective &&
    matchesStatus
  );
});

    // Carry forward "In Progress" tasks from before the selected timeframe
    // Only when a specific timeframe is selected and status filter allows it
    if (selectedTimeframe && ((selectedStatus === "ALL" || selectedStatus === "In Progress" || selectedStatus === "Blocked"))) {
      const timeframeTaskIds = new Set(timeframeTasks.map(t => t.task_id));
     const carryForward = tasks.filter(task =>
  task.date < selectedTimeframe.start_date &&
  (
    task.status === "In Progress" ||
    task.status === "Blocked" ||
    (
      task.status === "Done" &&
      (task.effort_hours_log || []).some(
        (log: any) =>
          log.timeframe_id === selectedTimeframe.timeframe_id
      )
    )
  ) &&
  !timeframeTaskIds.has(task.task_id) &&
  (selectedPersonId === "ALL" || task.person_id === selectedPersonId) &&
  (selectedProjectId === "ALL" || task.project_id === selectedProjectId) &&
  (selectedObjectiveId === "ALL" || task.objective_id === selectedObjectiveId) &&
  (
    selectedStatus === "ALL" ||
    task.status === selectedStatus
  )
);
      return [...timeframeTasks, ...carryForward].sort((a, b) => {
  const aRecent = a.updated_at || a.date;
  const bRecent = b.updated_at || b.date;
  return bRecent.localeCompare(aRecent);
});
    }

    return timeframeTasks;
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
                onChange={(e) => { setSelectedTimeframeId(e.target.value); persistFilters({ timeframe_id: e.target.value }); }}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
              >
                <option value="ALL">All Timeframes</option>
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
                onChange={(e) => { setSelectedPersonId(e.target.value); persistFilters({ person_id: e.target.value }); }}
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
                onChange={(e) => { setSelectedObjectiveId(e.target.value); persistFilters({ objective_id: e.target.value }); }}
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
                onChange={(e) => { setSelectedStatus(e.target.value); persistFilters({ status: e.target.value }); }}
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
              <thead className="sticky top-0 z-50 border-b border-slate-200 bg-slate-50">
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
                    <td className="px-5 py-4 align-top text-sm text-slate-900" title={task.description}>{truncateText(task.description)}</td>
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

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100" />}>
      <TasksPageInner />
    </Suspense>
  );
}