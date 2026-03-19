import Link from "next/link";

async function getTask(taskId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
    cache: "no-store",
  });

  return res.json();
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getTask(id);

  if (!result.success || !result.data) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm text-rose-600">Task not found.</p>
          </div>
        </div>
      </main>
    );
  }

  const task = result.data;

  const items = [
    ["Date", task.date],
    ["Person", task.person_name],
    ["Project", task.project_name],
    ["Objective", task.objective_name],
    ["Task Type", task.task_type],
    ["Status", task.status],
    ["Effort Hours", String(task.effort_hours ?? 0)],
    ["Blocked", task.blocker_flag ? "Yes" : "No"],
    ["Created At", task.created_at],
    ["Updated At", task.updated_at],
  ];

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Task Details
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              {task.task_id}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              View task details, project mapping, blockers, and learnings.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/tasks"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Tasks
            </Link>
            <Link
              href={`/tasks/${task.task_id}/edit`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Edit Task
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-950">Summary</h2>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="divide-y divide-slate-200">
                {items.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[160px_1fr] gap-4 px-5 py-4"
                  >
                    <div className="text-sm font-medium text-slate-500">
                      {label}
                    </div>
                    <div className="text-sm text-slate-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-semibold text-slate-950">
                Description
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {task.description || "-"}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-semibold text-slate-950">Insight</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {task.insight || "-"}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-semibold text-slate-950">Blocker</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {task.blocker_flag
                  ? task.blocker_description || "-"
                  : "No blocker"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
