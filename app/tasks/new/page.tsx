import TaskForm from "@/components/forms/task-form";
import Link from "next/link";

export default function NewTaskPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Tasks
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                New Task
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Capture work done by team members under a project and objective.
              </p>
            </div>

            <Link
              href="/tasks"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Tasks
            </Link>
          </div>
        </div>

        <TaskForm />
      </div>
    </main>
  );
}
