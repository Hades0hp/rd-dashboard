"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Timeframe = {
  timeframe_id: string;
  name?: string;
  start_date: string;
  end_date: string;
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
  task_type: string;
  status: string;
  effort_hours: number;

  effort_hours_log?: {
    timeframe_id: string;
    hours: number;
  }[];

  blocker_flag: boolean;
  blocker_description?: string;
  insight?: string;
  created_at: string;
  updated_at: string;
};

type Blocker = {
  blocker_id: string;
  blocker_title?: string;
  blocker_description: string;
  assigned_to_resolve?: string;
  blocker_status?: string;
  resolution_notes?: string;
  created_at?: string;
  resolved_at?: string;
};

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr] border-b border-slate-200 last:border-b-0">
      <div className="py-3 pr-4 text-sm text-slate-500">{label}</div>
      <div className="py-3 text-sm font-medium text-slate-900">{value || "-"}</div>
    </div>
  );
}

export default function TaskDetailPage() {
  const params = useParams();
  console.log("PARAMS =", params);

  const rawId = params?.id;
  const taskId = Array.isArray(rawId) ? rawId[0] : rawId;
  console.log("PARAMS:", params);
  console.log("TASK ID:", taskId);

  const [task, setTask] = useState<Task | null>(null);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockerError, setBlockerError] = useState("");
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  
  const sprintHistory =
  [...(task?.effort_hours_log || [])]
    .reverse()
    .map((log) => {
      const timeframe = timeframes.find(
        (tf) => tf.timeframe_id === log.timeframe_id
      );

      return {
        timeframeName:
          timeframe?.name || log.timeframe_id,
        hours: Number(log.hours || 0),
      };
    });

  const totalLoggedHours =
  task?.effort_hours_log?.reduce(
    (sum, log) => sum + Number(log.hours || 0),
    0
  ) ?? task?.effort_hours ?? 0;

  useEffect(() => {
    async function loadData() {
      try {
        if (!taskId) { setLoading(false); return; }

        const taskRes = await fetch("/api/tasks", { cache: "no-store" });
        const taskJson = await taskRes.json();

        const allTasks: Task[] = taskJson?.data || [];
        const normalizedTaskId = decodeURIComponent(String(taskId)).trim();

        const foundTask =
          allTasks.find(
            (t) => decodeURIComponent(String(t.task_id)).trim() === normalizedTaskId
          ) || null;

        setTask(foundTask);

        try {
          const blockersRes = await fetch(`/api/tasks/${taskId}/blockers`, { cache: "no-store" });
          const blockersJson = await blockersRes.json();
          const timeframesRes = await fetch("/api/timeframes", {
  cache: "no-store",
});

const timeframesJson = await timeframesRes.json();

setTimeframes(timeframesJson?.data || []);

          if (blockersRes.ok) {
            setBlockers(blockersJson?.data || []);
            setBlockerError("");
          } else {
            setBlockers([]);
            setBlockerError(blockersJson?.error || "Failed to load blockers");
          }
        } catch (error: any) {
          setBlockers([]);
          setBlockerError(error?.message || "Failed to load blockers");
        }
      } catch (error) {
        console.error("Error loading task details:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [taskId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-10 py-10">
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </main>
    );
  }

  if (!task) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-10 py-10">
          <Link href="/tasks" className="text-sm text-slate-600 underline">
            ← Back to Tasks
          </Link>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            Task not found.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-10 py-10">

        {/* Header — pill label top-left, buttons top-right, h1 + subtitle below */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Pill label */}
              <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Task Details
              </div>
              {/* Big title */}
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
                {task.task_id}
              </h1>
              {/* Subtitle */}
              <p className="mt-2 text-sm text-slate-500">
                View task details, project mapping, blockers, and learnings.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex shrink-0 items-center gap-3 pt-1">
              <Link
                href="/tasks"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                Back to Tasks
              </Link>
              <Link
                href={`/tasks/${task.task_id}/edit`}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                Edit Task
              </Link>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
       <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          
          
          {/* Left — Summary card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Summary</h2>
            <div>
            <SummaryRow label="Date" value={task.date} />
            <SummaryRow label="Person" value={task.person_name} />
            <SummaryRow label="Project" value={task.project_name} />
            <SummaryRow label="Objective" value={task.objective_name} />
            <SummaryRow label="Task Type" value={task.task_type} />
            <SummaryRow label="Status" value={task.status} />
            <SummaryRow label="Total Logged Hours" value={`${totalLoggedHours}h`}/>
            <SummaryRow label="Blocked" value={task.blocker_flag ? "Yes" : "No"} />
            </div>
          </div>

         {/* Right — Detail cards */}
<div className="flex flex-col gap-6">

  {/* Description */}
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-3 text-lg font-bold text-slate-900">
      Description
    </h2>

    <p className="text-sm leading-7 text-slate-700">
      {task.description || "-"}
    </p>
  </div>

  {/* Insight */}
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-3 text-lg font-bold text-slate-900">
      Insight
    </h2>

    <p className="text-sm leading-7 text-slate-700">
      {task.insight || "-"}
    </p>
  </div>

  {/* Blocker Details */}
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-3 text-lg font-bold text-slate-900">
      Blocker Details
    </h2>

    {!task.blocker_flag ? (
      <p className="text-sm text-slate-400">
        No blocker for this task.
      </p>
    ) : blockerError ? (
      <p className="text-sm text-red-500">
        Could not load blocker details: {blockerError}
      </p>
    ) : blockers.length === 0 ? (
      <div className="space-y-3">
        <p className="text-sm text-slate-400">
          Task is blocked but no blocker record found.
        </p>

        {task.blocker_description ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium text-slate-500">
              Legacy blocker text
            </div>

            <div className="mt-1 text-sm text-slate-700">
              {task.blocker_description}
            </div>
          </div>
        ) : null}
      </div>
    ) : (
      <div className="space-y-4">
        {blockers.map((b) => (
          <div
            key={b.blocker_id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="text-sm font-semibold text-slate-900">
                {b.blocker_title || "Blocker"}
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold ${
                  b.blocker_status === "Resolved"
                    ? "bg-emerald-100 text-emerald-700"
                    : b.blocker_status === "In Progress"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {b.blocker_status || "Open"}
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              {b.blocker_description || "-"}
            </p>

            <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500">
              <span>
                <span className="font-medium text-slate-700">
                  Assigned to:
                </span>{" "}
                {b.assigned_to_resolve || "-"}
              </span>

              {b.resolution_notes && (
                <span>
                  <span className="font-medium text-slate-700">
                    Resolution:
                  </span>{" "}
                  {b.resolution_notes}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

</div>

{/* CLOSE THE 2-COLUMN GRID */}
</div>

{/* Sprint History BELOW EVERYTHING */}

{Array.isArray(sprintHistory) && sprintHistory.length > 0 && (
  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-lg font-bold text-slate-900">
      Sprint History
    </h2>

    <div className="space-y-3">
      {sprintHistory.map((entry, index) => (
        <div
          key={`${entry.timeframeName}-${index}`}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <span className="text-sm text-slate-700">
            {entry.timeframeName}
          </span>

          <span className="text-sm font-semibold text-slate-900">
            {entry.hours}h
          </span>
        </div>
      ))}
    </div>

    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          Total
        </span>

        <span className="text-sm font-bold text-slate-900">
          {totalLoggedHours}h
        </span>
      </div>
    </div>
  </div>
)}

</div>
</main>
 );
}