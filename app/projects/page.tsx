"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Project = {
  project_id: string;
  name: string;
  objective?: string;
  priority?: "High" | "Medium" | "Low";
  planned_effort_pct?: number;
  status: "Active" | "Paused" | "Archived";
  progress_pct?: number;
};

function priorityBadge(priority?: string) {
  if (priority === "High") return "bg-rose-100 text-rose-700";
  if (priority === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function statusBadge(status: string) {
  if (status === "Active") return "bg-emerald-100 text-emerald-700";
  if (status === "Paused") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects");
        const json = await res.json();
        setProjects(json.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Projects
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Projects
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Manage project definitions, priorities, effort expectations, and
              progress.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            New Project
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Objective
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Planned Effort %
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Progress %
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Status
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
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        Loading projects...
                      </td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        No projects found.
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => (
                      <tr key={project.project_id} className="align-top">
                        <td className="px-4 py-4 text-sm font-medium text-slate-900">
                          {project.name}
                        </td>
                        <td className="max-w-[320px] px-4 py-4 text-sm text-slate-700">
                          <div className="line-clamp-2">
                            {project.objective || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityBadge(project.priority)}`}
                          >
                            {project.priority || "Low"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {project.planned_effort_pct ?? 0}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {project.progress_pct ?? 0}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(project.status)}`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/projects/${project.project_id}`}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              View
                            </Link>
                            <Link
                              href={`/projects/${project.project_id}/edit`}
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
