"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";

type Timeframe = {
  timeframe_id: string;
  name?: string;
  start_date: string;
  duration_days: number;
  end_date: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  planned_effort?: { project_id: string; project_name: string; planned_pct: number }[];
};

type Project = {
  project_id: string;
  name?: string;
  project_name?: string;
};

type EffortEntry = {
  project_id: string;
  project_name: string;
  planned_pct: string;
};

function calculateEndDatePreview(startDate: string, durationDays: number) {
  try {
    return format(addDays(new Date(startDate), durationDays - 1), "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export default function TimeframesPage() {
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [durationDays, setDurationDays] = useState("7");
  const [effortEntries, setEffortEntries] = useState<EffortEntry[]>([]);

  async function loadTimeframes() {
    try {
      const res = await fetch("/api/timeframes");
      const json = await res.json();
      setTimeframes(json.data || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadProjects() {
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const json = await res.json();
      const loaded: Project[] = json?.data || [];
      setProjects(loaded);
      setEffortEntries(
        loaded.map((p) => ({
          project_id: p.project_id,
          project_name: p.name || p.project_name || p.project_id,
          planned_pct: "",
        })),
      );
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadTimeframes();
    loadProjects();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const activeTimeframeId = useMemo(() => {
    const active = timeframes.find(
      (t) => t.start_date <= today && t.end_date >= today,
    );
    return active?.timeframe_id || null;
  }, [timeframes, today]);

  const previewEndDate = useMemo(
    () => calculateEndDatePreview(startDate, Number(durationDays) || 7),
    [startDate, durationDays],
  );

  const totalPct = useMemo(
    () => effortEntries.reduce((sum, e) => sum + (Number(e.planned_pct) || 0), 0),
    [effortEntries],
  );

  const hasAnyEffort = effortEntries.some((e) => e.planned_pct !== "");

  function updateEffortEntry(projectId: string, value: string) {
    setEffortEntries((prev) =>
      prev.map((e) =>
        e.project_id === projectId ? { ...e, planned_pct: value } : e,
      ),
    );
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setDurationDays("7");
    setMessage("");
    setEffortEntries((prev) => prev.map((e) => ({ ...e, planned_pct: "" })));
  }

  function handleEdit(timeframe: Timeframe) {
    setEditingId(timeframe.timeframe_id);
    setName(timeframe.name || "");
    setStartDate(timeframe.start_date);
    setDurationDays(String(timeframe.duration_days));
    setMessage("");
    setEffortEntries((prev) =>
      prev.map((e) => {
        const saved = timeframe.planned_effort?.find(
          (p) => p.project_id === e.project_id,
        );
        return { ...e, planned_pct: saved ? String(saved.planned_pct) : "" };
      }),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!startDate) {
      setMessage("Start date is required.");
      setMessageIsError(true);
      return;
    }

    if (hasAnyEffort && Math.round(totalPct) !== 100) {
      setMessage(
        `Planned effort must total 100%. Currently at ${totalPct}% — ${
          totalPct < 100 ? `${100 - totalPct}% remaining` : `${totalPct - 100}% over`
        }.`,
      );
      setMessageIsError(true);
      return;
    }

    setLoading(true);

    try {
      const url = editingId ? `/api/timeframes/${editingId}` : "/api/timeframes";
      const method = editingId ? "PUT" : "POST";

      const plannedEffort = hasAnyEffort
        ? effortEntries
            .filter((e) => e.planned_pct !== "")
            .map((e) => ({
            project_id: e.project_id,
            project_name: e.project_name,
            planned_pct: Number(e.planned_pct),
            }))
        : [];

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          start_date: startDate,
          duration_days: Number(durationDays) || 7,
          created_by: "Hitesh",
          planned_effort: plannedEffort,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setMessage(json.error || "Failed to save timeframe");
        setMessageIsError(true);
        return;
      }

      setMessage(
        editingId ? "Timeframe updated successfully." : "Timeframe created successfully.",
      );
      setMessageIsError(false);
      resetForm();
      await loadTimeframes();
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
      setMessageIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Timeframes
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Sprint / Timeframe Management
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Create and manage sprint-like timeframes used by the task list and
            executive dashboard.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr]">
          {/* ── Left: form ── */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-950">
              {editingId ? "Edit Timeframe" : "Create Timeframe"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Define a timeframe using a start date and duration.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sprint 1"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-700">
                  Calculated End Date
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {previewEndDate || "-"}
                </p>
              </div>

              {/* ── Planned Effort ── */}
              {projects.length > 0 && (
                <>
                  <div className="border-t border-slate-200" />

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Planned Effort by Project{" "}
                      <span className="font-normal text-slate-400">
                        — optional, must total 100%
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Set the expected % of sprint effort per project.
                    </p>

                    <div className="mt-3 space-y-2">
                      {effortEntries.map((entry) => (
                        <div key={entry.project_id} className="flex items-center gap-3">
                          <span className="flex-1 truncate text-sm text-slate-700">
                            {entry.project_name}
                          </span>
                          <div className="relative w-24 shrink-0">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={entry.planned_pct}
                              onChange={(e) =>
                                updateEffortEntry(entry.project_id, e.target.value)
                              }
                              className="h-9 w-full rounded-xl border border-slate-300 bg-white pl-3 pr-7 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                              %
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total — only shown once user starts typing */}
                    {hasAnyEffort && (
                      <div
                        className={`mt-3 flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                          totalPct === 100
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : totalPct > 100
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span>Total</span>
                        <span>
                          {totalPct}%
                          {totalPct !== 100 && (
                            <span className="ml-1.5 font-normal">
                              {totalPct < 100
                                ? `(${100 - totalPct}% remaining)`
                                : `(${totalPct - 100}% over)`}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Message */}
              {message && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    messageIsError
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update Timeframe"
                    : "Create Timeframe"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ── Right: existing timeframes ── */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-950">
              Existing Timeframes
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Used by the task list and dashboard. The current active timeframe
              is derived automatically from today's date.
            </p>

            <div className="mt-6 max-h-[560px] space-y-4 overflow-y-auto pr-2">
              {timeframes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No timeframes created yet.
                </div>
              ) : (
                timeframes.map((timeframe) => {
                  const isActive = timeframe.timeframe_id === activeTimeframeId;
                  return (
                    <div
                      key={timeframe.timeframe_id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900">
                              {timeframe.name || timeframe.timeframe_id}
                            </h3>
                            {isActive && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Active Today
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {timeframe.start_date} → {timeframe.end_date} •{" "}
                            {timeframe.duration_days} days
                          </p>
                          {/* Planned effort pills */}
                          {timeframe.planned_effort && timeframe.planned_effort.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {timeframe.planned_effort.map((p) => (
                                <span
                                  key={p.project_id}
                                  className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600"
                                >
                                  {p.project_name} · {p.planned_pct}%
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEdit(timeframe)}
                          className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}