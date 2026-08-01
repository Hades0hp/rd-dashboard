import Link from "next/link";
import { getAllBlockers } from "@/lib/sheets/blockers";

type Blocker = {
  blocker_id: string;
  task_id: string;
  task_description: string;
  person_id: string;
  person_name: string;
  project_id: string;
  project_name: string;
  objective_id?: string;
  objective_name?: string;
  blocker_title?: string;
  blocker_description: string;
  assigned_to_resolve?: string;
  blocker_status: string;
  resolution_notes?: string;
  created_at: string;
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
    <div className="flex items-start gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="w-36 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value || "-"}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Open: "bg-red-100 text-red-700",
    "In Progress": "bg-amber-100 text-amber-700",
    Resolved: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

export default async function BlockerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let blocker: Blocker | null = null;

  try {
    const allBlockers = await getAllBlockers();
    blocker = allBlockers.find((b) => b.blocker_id === id) || null;
  } catch (error) {
    console.error("Error fetching blocker:", error);
  }

  if (!blocker) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-[1400px] px-8 py-10">
          <Link href="/blockers" className="text-sm text-slate-600 underline">
            ← Back to Blockers
          </Link>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-500">Blocker not found.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1400px] px-8 py-10">

        {/* Header — matches Task Details header exactly */}
        <div className="mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Blocker Details
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review blocker information, description, and resolution details for this entry.
          </p>
        </div>

        {/* Back to Blockers button — top right, matches "Back to Tasks" */}
        <div className="mb-8 flex justify-end">
          <Link
            href="/blockers"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Back to Blockers
          </Link>
        </div>

        {/* Two-column layout — matches Task Details grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">

          {/* Left — Summary card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Summary</h2>
            <SummaryRow label="Date" value={blocker.created_at?.slice(0, 10)} />
            <SummaryRow label="Person" value={blocker.person_name} />
            <SummaryRow label="Project" value={blocker.project_name} />
            <SummaryRow label="Objective" value={blocker.objective_name} />
            <SummaryRow label="Assigned To" value={blocker.assigned_to_resolve} />
            <SummaryRow
              label="Status"
              value={<StatusBadge status={blocker.blocker_status} />}
            />
            <SummaryRow label="Task ID" value={blocker.task_id} />
            <SummaryRow
              label="Resolved At"
              value={blocker.resolved_at?.slice(0, 10) || "-"}
            />
          </div>

          {/* Right — Detail cards */}
          <div className="flex flex-col gap-6">

            {/* Description card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-slate-900">Description</h2>
              <p className="text-sm leading-7 text-slate-700">
                {blocker.blocker_description || "-"}
              </p>
            </div>

            {/* Task Description card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-slate-900">Task Description</h2>
              <p className="text-sm leading-7 text-slate-700">
                {blocker.task_description || "-"}
              </p>
            </div>

            {/* Resolution Notes card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-slate-900">Resolution Notes</h2>
              {blocker.resolution_notes ? (
                <p className="text-sm leading-7 text-slate-700">
                  {blocker.resolution_notes}
                </p>
              ) : (
                <p className="text-sm text-slate-400">-</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}