"use client";

import { useEffect, useMemo, useState } from "react";

type Timeframe = {
  timeframe_id: string;
  name?: string;
  start_date: string;
  duration_days: number;
  end_date: string;
  status?: string;
};

type DashboardData = {
  summary: {
    total_tasks: number;
    total_hours: number;
    active_projects: number;
    active_people: number;
    blockers_count: number;
    insights_count: number;
  };
  project_effort: Array<{
    project_id: string;
    project_name: string;
    task_count: number;
    total_hours: number;
    planned_effort_pct: number;
    actual_effort_pct: number;
    gap: number;
  }>;
  objective_effort: Array<{
    objective_id: string;
    objective_name: string;
    project_id: string;
    project_name: string;
    task_count: number;
    total_hours: number;
    actual_effort_pct: number;
  }>;
  people_contribution: Array<{
    person_id: string;
    person_name: string;
    task_count: number;
    total_hours: number;
    blockers_count: number;
    insights_count: number;
  }>;
  blockers: Array<{
    task_id: string;
    date: string;
    person_name: string;
    project_name: string;
    objective_name: string;
    blocker_title: string;
    blocker_description: string;
    assigned_to_resolve: string;
    blocker_status: string;
  }>;
  insights: Array<{
    task_id: string;
    date: string;
    person_name: string;
    project_name: string;
    objective_name: string;
    insight: string;
  }>;
  all_projects: Array<{
    project_id: string;
    project_name: string;
  }>;
  metadata: {
    selected_timeframes_count: number;
    selected_timeframe_names: string[];
    objectives_count: number;
    people_count: number;
    projects_count: number;
  };
};

function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 ${className}`}>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [selectedTimeframeIds, setSelectedTimeframeIds] = useState<string[]>([]);
  const [selectedProjectForObjectives, setSelectedProjectForObjectives] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [timeframesRes, activeRes] = await Promise.all([
          fetch("/api/timeframes", { cache: "no-store" }),
          fetch("/api/timeframes?mode=active", { cache: "no-store" }),
        ]);

        const timeframesJson = await timeframesRes.json();
        const activeJson = await activeRes.json();

        const allTimeframes = timeframesJson.data || [];
        setTimeframes(allTimeframes);

        let initialIds: string[] = [];
        if (activeJson.data?.timeframe_id) {
          initialIds = [activeJson.data.timeframe_id];
        } else if (allTimeframes.length > 0) {
          initialIds = [allTimeframes[0].timeframe_id];
        }

        setSelectedTimeframeIds(initialIds);
        if (initialIds.length > 0) {
          await loadDashboard(initialIds);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  async function loadDashboard(timeframeIds: string[]) {
    if (timeframeIds.length === 0) {
      setDashboard(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("timeframe_ids", timeframeIds.join(","));
      const res = await fetch(`/api/dashboard?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      setDashboard(json.data || null);
      setSelectedProjectForObjectives("ALL");
    } catch (error) {
      console.error(error);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTimeframe(timeframeId: string) {
    const nextIds = selectedTimeframeIds.includes(timeframeId)
      ? selectedTimeframeIds.filter((id) => id !== timeframeId)
      : [...selectedTimeframeIds, timeframeId];
    setSelectedTimeframeIds(nextIds);
    if (nextIds.length > 0) {
      await loadDashboard(nextIds);
    } else {
      setDashboard(null);
    }
  }

  async function clearAllTimeframes() {
    setSelectedTimeframeIds([]);
    setDashboard(null);
  }

  async function selectActiveTimeframe() {
    const active = timeframes.find((tf) => tf.status === "Active") || timeframes[0];
    if (!active) return;
    const ids = [active.timeframe_id];
    setSelectedTimeframeIds(ids);
    await loadDashboard(ids);
  }

  const projectOptions = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.all_projects || dashboard.project_effort.map((item) => ({
      project_id: item.project_id,
      project_name: item.project_name,
    }));
  }, [dashboard]);

  const filteredObjectiveEffort = useMemo(() => {
    if (!dashboard) return [];
    if (selectedProjectForObjectives === "ALL") return dashboard.objective_effort;
    const selectedProject = projectOptions.find((p) => p.project_id === selectedProjectForObjectives);
    if (!selectedProject) return dashboard.objective_effort;
    return dashboard.objective_effort.filter((item) => item.project_id === selectedProject.project_id || item.project_name === selectedProject.project_name);
  }, [dashboard, selectedProjectForObjectives, projectOptions]);

  const activeBlockers = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.blockers.filter(
      (item) => item.blocker_status === "Open" || item.blocker_status === "In Progress"
    );
  }, [dashboard]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-950">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            View team effort, project alignment, objective activity, blockers, and insights across selected timeframes.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Select Timeframes</p>
              <p className="text-xs text-slate-400">Select multiple timeframes to view combined results.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectActiveTimeframe}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Select Active
              </button>
              <button
                type="button"
                onClick={clearAllTimeframes}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {timeframes.map((timeframe) => {
              const isSelected = selectedTimeframeIds.includes(timeframe.timeframe_id);
              return (
                <button
                  key={timeframe.timeframe_id}
                  type="button"
                  onClick={() => toggleTimeframe(timeframe.timeframe_id)}
                  className={`rounded-xl border px-4 py-2 text-left text-sm transition ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{timeframe.name || timeframe.timeframe_id}</div>
                  <div className={`text-xs ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                    {timeframe.start_date} → {timeframe.end_date}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading dashboard...
          </div>
        ) : !dashboard ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No dashboard data available. Select at least one timeframe.
          </div>
        ) : (
          <div className="space-y-5">

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
              {[
                ["Total Tasks", dashboard.summary.total_tasks],
                ["Total Hours", dashboard.summary.total_hours],
                ["Active Projects", dashboard.summary.active_projects],
                ["Active People", dashboard.summary.active_people],
                ["Blockers", activeBlockers.length],
                ["Insights", dashboard.summary.insights_count],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
                </div>
              ))}
            </div>

            {/* Project Effort table */}
            <SectionCard
              title="Project Effort"
              subtitle="Combined actual effort % by project across selected timeframes."
            >
              {dashboard.project_effort.length === 0 ? (
                <p className="text-sm text-slate-400">No project activity found.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="pb-2 pr-4">Project</th>
                      <th className="pb-2 pr-4">Actual Effort %</th>
                      <th className="pb-2 pr-4">Planned Effort %</th>
                      <th className="pb-2 pr-4">Gap %</th>
                      <th className="pb-2">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.project_effort.map((item) => (
                      <tr key={item.project_id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4 font-medium text-slate-900">{item.project_name}</td>
                        <td className="py-3 pr-4 text-slate-700">{item.actual_effort_pct}%</td>
                        <td className="py-3 pr-4 text-slate-700">{item.planned_effort_pct}%</td>
                        <td className={`py-3 pr-4 font-medium ${item.gap < 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {item.gap}%
                        </td>
                        <td className="py-3 text-slate-700">{item.total_hours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>

            {/* Objective Activity + People Contribution */}
            <div className="grid gap-5 xl:grid-cols-2">
              <SectionCard
                title="Objective Activity"
                subtitle="Combined task count by objective across selected timeframes."
              >
                <div className="mb-4">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Project Filter</label>
                  <select
                    value={selectedProjectForObjectives}
                    onChange={(e) => setSelectedProjectForObjectives(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                  >
                    <option value="ALL">All Projects</option>
                    {projectOptions.map((project) => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                </div>
                {filteredObjectiveEffort.length === 0 ? (
                  <p className="text-sm text-slate-400">No objective activity found.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="pb-2 pr-4">Objective</th>
                        <th className="pb-2 pr-4">Project</th>
                        <th className="pb-2">Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredObjectiveEffort.map((item) => (
                        <tr key={item.objective_id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 pr-4 font-medium text-slate-900">{item.objective_name}</td>
                          <td className="py-3 pr-4 text-slate-500">{item.project_name}</td>
                          <td className="py-3 text-slate-700">{item.task_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </SectionCard>

              <SectionCard
                title="People Contribution"
                subtitle="Combined hours contributed by person across selected timeframes."
              >
                {dashboard.people_contribution.length === 0 ? (
                  <p className="text-sm text-slate-400">No people contribution found.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="pb-2 pr-4">Person</th>
                        <th className="pb-2 pr-4">Hours</th>
                        <th className="pb-2 pr-4">Tasks</th>
                        <th className="pb-2 pr-4">Blockers</th>
                        <th className="pb-2">Insights</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.people_contribution.map((person) => (
                        <tr key={person.person_id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 pr-4 font-medium text-slate-900">{person.person_name}</td>
                          <td className="py-3 pr-4 text-slate-700">{person.total_hours}h</td>
                          <td className="py-3 pr-4 text-slate-700">{person.task_count}</td>
                          <td className="py-3 pr-4 text-slate-700">{person.blockers_count}</td>
                          <td className="py-3 text-slate-700">{person.insights_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </SectionCard>
            </div>

            {/* Blockers + Insights */}
            <div className="grid gap-5 xl:grid-cols-2">
              <SectionCard
                title="Blockers"
                subtitle="Only active blockers are shown here."
              >
                {activeBlockers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-400">
                    No blockers found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeBlockers.map((item) => (
                      <div
                        key={`${item.task_id}-${item.date}-${item.blocker_description}`}
                        className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-xs font-medium text-slate-500">
                            {item.project_name}
                            {item.objective_name ? <> &bull; {item.objective_name}</> : null}
                          </span>
                          <span className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium ${
                            item.blocker_status === "Open"
                              ? "border-red-200 bg-white text-red-700"
                              : "border-amber-200 bg-white text-amber-700"
                          }`}>
                            {item.blocker_status}
                          </span>
                        </div>
                        <div className="mt-1.5 text-sm font-semibold text-slate-900">
                          {item.blocker_title || "Untitled Blocker"}
                        </div>
                        <div className="mt-1 text-sm leading-5 text-slate-600">
                          {item.blocker_description}
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              title={item.person_name}
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200 text-[10px] font-bold text-rose-800"
                            >
                              {item.person_name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-500">Raised</span>
                          </div>
                          {item.assigned_to_resolve && (
                            <div className="flex items-center gap-1.5">
                              <span
                                title={item.assigned_to_resolve}
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800"
                              >
                                {item.assigned_to_resolve.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()}
                              </span>
                              <span className="text-xs text-slate-500">Assigned</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Insights"
                subtitle="Combined insight list across selected timeframes."
              >
                {dashboard.insights.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-400">
                    No insights found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboard.insights.map((item) => (
                      <div
                        key={item.task_id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-xs text-slate-400">
                          {item.date} • {item.person_name} • {item.project_name} • {item.objective_name}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{item.insight}</p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}