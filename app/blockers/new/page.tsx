import Link from "next/link";
import ProjectBlockerForm from "@/components/forms/project-blocker-form";

export default function NewBlockerPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Blockers
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              New Project Blocker
            </h1>

            <p className="mt-3 text-base text-slate-600">
              Create a blocker directly for a project without linking it to a task.
            </p>
          </div>

          <Link
            href="/blockers"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Blockers
          </Link>

        </div>

        <ProjectBlockerForm />

      </div>
    </main>
  );
}