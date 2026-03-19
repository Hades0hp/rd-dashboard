import TaskForm from "@/components/forms/task-form";

export default function TasksPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Tasks
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Daily Task Logging
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Capture work done by team members under a project and objective,
            along with insights, blockers, and effort. This data feeds the
            executive dashboard and helps maintain alignment across the R&amp;D
            team.
          </p>
        </div>

        <TaskForm />
      </div>
    </main>
  );
}
