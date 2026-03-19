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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [durationDays, setDurationDays] = useState("7");

  async function loadTimeframes() {
    try {
      const res = await fetch("/api/timeframes");
      const json = await res.json();
      setTimeframes(json.data || []);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadTimeframes();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const activeTimeframeId = useMemo(() => {
    const active = timeframes.find(
      (t) => t.start_date <= today && t.end_date >= today,
    );
    return active?.timeframe_id || null;
  }, [timeframes, today]);

  const previewEndDate = useMemo(() => {
    return calculateEndDatePreview(startDate, Number(durationDays) || 7);
  }, [startDate, durationDays]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setDurationDays("7");
    setMessage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!startDate) {
      setMessage("Start date is required.");
      return;
    }

    setLoading(true);

    try {
      const url = editingId
        ? `/api/timeframes/${editingId}`
        : "/api/timeframes";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          start_date: startDate,
          duration_days: Number(durationDays) || 7,
          created_by: "Hitesh",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setMessage(json.error || "Failed to save timeframe");
        return;
      }

      setMessage(
        editingId
          ? "Timeframe updated successfully."
          : "Timeframe created successfully.",
      );
      resetForm();
      await loadTimeframes();
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(timeframe: Timeframe) {
    setEditingId(timeframe.timeframe_id);
    setName(timeframe.name || "");
    setStartDate(timeframe.start_date);
    setDurationDays(String(timeframe.duration_days));
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

              {message && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-950">
              Existing Timeframes
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Used by the task list and dashboard. The current active timeframe
              is derived automatically from today’s date.
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
                        <div>
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
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEdit(timeframe)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
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
