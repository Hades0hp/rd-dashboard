import Link from "next/link";
import TaskEditForm from "@/components/forms/task-edit-form";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Tasks
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Edit Task
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Update an existing task entry.
            </p>
          </div>

          <Link
            href={`/tasks/${id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Task
          </Link>
        </div>

        <TaskEditForm taskId={id} />
      </div>
    </main>
  );
}
