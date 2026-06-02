"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

type Timeframe = {
  timeframe_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status?: string;
};

function formatTimeframeLabel(tf: Timeframe) {
  return `${tf.name} (${tf.start_date} → ${tf.end_date})`;
}

function getStatusBadge(status: string) {
  if (status === "Open") {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        Open
      </span>
    );
  }
  if (status === "In Progress") {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
        In Progress
      </span>
    );
  }
  if (status === "Resolved") {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
        Resolved
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {status}
    </span>
  );
}

export default function BlockersPage() {
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTimeframeId, setSelectedTimeframeId] = useState("all");

  async function loadData() {
    try {
      const [blockersRes, timeframesRes] = await Promise.all([
        fetch("/api/blockers", { cache: "no-store" }),
        fetch("/api/timeframes", { cache: "no-store" }),
      ]);
      const blockersJson = await blockersRes.json();
      const timeframesJson = await timeframesRes.json();
      const loadedBlockers = blockersJson?.data || [];
      const loadedTimeframes = timeframesJson?.data || [];
      setBlockers(loadedBlockers);
      setTimeframes(loadedTimeframes);
      setSelectedTimeframeId("all");
    } catch (error) {
      console.error("Error loading blockers page:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const selectedTimeframe = useMemo(
    () => timeframes.find((tf) => tf.timeframe_id === selectedTimeframeId) || null,
    [timeframes, selectedTimeframeId]
  );

  const filteredBlockers = useMemo(() => {
    return blockers.filter((blocker) => {
      const matchesStatus = statusFilter === "All" || blocker.blocker_status === statusFilter;

      // "All Timeframes" — skip date filtering entirely
      if (selectedTimeframeId === "all") return matchesStatus;

      // Filter ALL blockers (any status) by their created_at date against the selected timeframe
      const blockerDate = blocker.created_at ? blocker.created_at.slice(0, 10) : "";
      const matchesTimeframe = selectedTimeframe
        ? blockerDate >= selectedTimeframe.start_date && blockerDate <= selectedTimeframe.end_date
        : true;

      return matchesTimeframe && matchesStatus;
    });
  }, [blockers, selectedTimeframe, selectedTimeframeId, statusFilter]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1500px] px-8 py-8">

        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">Blockers</h1>
          <p className="mt-2 text-sm text-slate-500">
            View and manage blockers impacting task progress across the selected sprint/timeframe.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Timeframe</label>
              <select
                value={selectedTimeframeId}
                onChange={(e) => setSelectedTimeframeId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
              >
                <option value="all">All Timeframes</option>
                {timeframes.map((tf) => (
                  <option key={tf.timeframe_id} value={tf.timeframe_id}>
                    {formatTimeframeLabel(tf)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
              >
                <option value="All">All</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading blockers...</div>
          ) : filteredBlockers.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No blockers found for the selected filters.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  <th className="px-5 py-3">Task</th>
                  <th className="px-5 py-3">Blocker Title</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Assigned To</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlockers.map((b) => (
                  <tr key={b.blocker_id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-5 py-4 text-sm text-slate-900">{b.task_id || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-900">{b.blocker_title || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-900">{b.project_name || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-900">{b.assigned_to_resolve || "-"}</td>
                    <td className="px-5 py-4">{getStatusBadge(b.blocker_status)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/blockers/${b.blocker_id}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </Link>
                        <Link
                          href={`/blockers/${b.blocker_id}/edit`}
                          className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  );
}