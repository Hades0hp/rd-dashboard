"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Person = {
  person_id: string;
  name?: string;
  person_name?: string;
};

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

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
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
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

export default function EditBlockerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [blocker, setBlocker] = useState<Blocker | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const [form, setForm] = useState({
    blocker_title: "",
    blocker_description: "",
    assigned_to_resolve: "",
    blocker_status: "Open",
    resolution_notes: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [blockerRes, peopleRes] = await Promise.all([
          fetch(`/api/blockers/${id}`, { cache: "no-store" }),
          fetch("/api/people", { cache: "no-store" }),
        ]);

        const blockerJson = await blockerRes.json();
        const peopleJson = await peopleRes.json();
        const loadedBlocker = blockerJson?.data || null;

        if (!loadedBlocker) { setFetchError(true); return; }

        setBlocker(loadedBlocker);
        setPeople(peopleJson?.data || []);
        setForm({
          blocker_title: loadedBlocker.blocker_title || "",
          blocker_description: loadedBlocker.blocker_description || "",
          assigned_to_resolve: loadedBlocker.assigned_to_resolve || "",
          blocker_status: loadedBlocker.blocker_status || "Open",
          resolution_notes: loadedBlocker.resolution_notes || "",
        });
      } catch (error) {
        console.error("Error loading blocker edit page:", error);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.blocker_title.trim()) { alert("Blocker Title is required."); return; }
    if (!form.blocker_description.trim()) { alert("Blocker Description is required."); return; }
    if (!form.assigned_to_resolve.trim()) { alert("Assigned To Resolve is required."); return; }
    if (form.blocker_status === "Resolved" && !form.resolution_notes.trim()) {
      alert("Resolution Notes are required when blocker is Resolved.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/blockers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { alert(json?.error || "Failed to update blocker"); return; }
      router.push(`/blockers/${id}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating blocker:", error);
      alert("Failed to update blocker");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-[1400px] px-8 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-500">Loading blocker...</p>
          </div>
        </div>
      </main>
    );
  }

  if (fetchError || !blocker) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-[1400px] px-8 py-10">
          <Link href="/blockers" className="text-sm text-slate-600 underline">← Back to Blockers</Link>
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

        {/* Header — matches Task Details header style */}
        <div className="mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Edit Blocker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Update blocker information, status, and resolution details.
          </p>
        </div>

        {/* Action buttons — top right, mirrors "Back to Tasks" placement */}
        <div className="mb-8 flex justify-end gap-3">
          <Link
            href={`/blockers/${id}`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            form="edit-form"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Two-column layout — matches Task Details exactly */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">

          {/* Left — Read-only summary card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Summary</h2>
            <SummaryRow label="Date" value={blocker.created_at?.slice(0, 10)} />
            <SummaryRow label="Person" value={blocker.person_name} />
            <SummaryRow label="Project" value={blocker.project_name} />
            <SummaryRow label="Objective" value={blocker.objective_name} />
            <SummaryRow label="Task ID" value={blocker.task_id} />
            <SummaryRow
              label="Status"
              value={<StatusBadge status={form.blocker_status} />}
            />
            <SummaryRow label="Created At" value={blocker.created_at?.slice(0, 10)} />
            <SummaryRow label="Resolved At" value={blocker.resolved_at?.slice(0, 10) || "-"} />
          </div>

          {/* Right — Editable fields */}
          <form id="edit-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Blocker Title */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="mb-3 block text-lg font-bold text-slate-900">
                Blocker Title <span className="text-red-400">*</span>
              </label>
              <input
                value={form.blocker_title}
                onChange={(e) => setForm({ ...form, blocker_title: e.target.value })}
                placeholder="Enter blocker title"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white transition-colors"
                required
              />
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-slate-900">
                Description <span className="text-red-400">*</span>
              </h2>
              <textarea
                value={form.blocker_description}
                onChange={(e) => setForm({ ...form, blocker_description: e.target.value })}
                placeholder="Describe the blocker..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white transition-colors resize-none"
                required
              />
            </div>

            {/* Task Description (read-only) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-slate-900">Task Description</h2>
              <p className="text-sm leading-7 text-slate-500">{blocker.task_description || "-"}</p>
            </div>

            {/* Assignment & Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Assignment & Status</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Assigned To Resolve <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.assigned_to_resolve}
                    onChange={(e) => setForm({ ...form, assigned_to_resolve: e.target.value })}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-colors"
                    required
                  >
                    <option value="">Select assignee</option>
                    {people.map((person) => {
                      const label = person.name || person.person_name || person.person_id;
                      return <option key={person.person_id} value={label}>{label}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Blocker Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.blocker_status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        blocker_status: e.target.value,
                        resolution_notes: e.target.value === "Resolved" ? form.resolution_notes : "",
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-colors"
                    required
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Resolution Notes — only when Resolved */}
            {form.blocker_status === "Resolved" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-slate-900">
                  Resolution Notes <span className="text-red-400">*</span>
                </h2>
                <textarea
                  value={form.resolution_notes}
                  onChange={(e) => setForm({ ...form, resolution_notes: e.target.value })}
                  placeholder="Describe how this blocker was resolved..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white transition-colors resize-none"
                  required
                />
              </div>
            )}

            <p className="text-xs text-slate-400">
              <span className="text-red-400">*</span> Required fields
            </p>

          </form>
        </div>
      </div>
    </main>
  );
}