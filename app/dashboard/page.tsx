"use client";

import { useEffect, useMemo, useState } from "react";

type Timeframe = {
  timeframe_id: string;
  name?: string;
  start_date: string;
  duration_days: number;
  end_date: string;
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
    blocker_description: string;
  }>;
  insights: Array<{
    task_id: string;
    date: string;
    person_name: string;
    project_name: string;
    objective_name: string;
    insight: string;
  }>;
  metadata: {
    start_date: string;
    end_date: string;
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
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${className}`}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        {subtitle ? (
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [selectedTimeframeId, setSelectedTimeframeId] = useState("");
  const [selectedProjectForObjectives, setSelectedProjectForObjectives] =
    useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [timeframesRes, activeRes] = await Promise.all([
          fetch("/api/timeframes"),
          fetch("/api/timeframes?mode=active"),
        ]);

        const timeframesJson = await timeframesRes.json();
        const activeJson = await activeRes.json();

        const allTimeframes = timeframesJson.data || [];
        setTimeframes(allTimeframes);

        if (activeJson.data?.timeframe_id) {
          setSelectedTimeframeId(activeJson.data.timeframe_id);
          await loadDashboard(
            activeJson.data.start_date,
            activeJson.data.end_date,
          );
        } else if (allTimeframes.length > 0) {
          setSelectedTimeframeId(allTimeframes[0].timeframe_id);
          await loadDashboard(
            allTimeframes[0].start_date,
            allTimeframes[0].end_date,
          );
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

  async function loadDashboard(startDate: string, endDate: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard?start_date=${startDate}&end_date=${endDate}`,
      );
      const json = await res.json();
      setDashboard(json.data || null);
      setSelectedProjectForObjectives("ALL");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleTimeframeChange(timeframeId: string) {
    setSelectedTimeframeId(timeframeId);

    const timeframe = timeframes.find((t) => t.timeframe_id === timeframeId);
    if (!timeframe) return;

    await loadDashboard(timeframe.start_date, timeframe.end_date);
  }

  const projectOptions = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.project_effort.map((item) => ({
      project_id: item.project_id,
      project_name: item.project_name,
    }));
  }, [dashboard]);

  const filteredObjectiveEffort = useMemo(() => {
    if (!dashboard) return [];
    if (selectedProjectForObjectives === "ALL") {
      return dashboard.objective_effort;
    }

    const selectedProject = projectOptions.find(
      (p) => p.project_id === selectedProjectForObjectives,
    );

    if (!selectedProject) return dashboard.objective_effort;

    return dashboard.objective_effort.filter(
      (item) => item.project_name === selectedProject.project_name,
    );
  }, [dashboard, selectedProjectForObjectives, projectOptions]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Dashboard
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Executive Dashboard
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              View team effort, project alignment, objective activity, blockers,
              and insights for the selected timeframe.
            </p>
          </div>

          <div className="w-full max-w-sm">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Timeframe
            </label>
            <select
              value={selectedTimeframeId}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
            >
              <option value="">Select timeframe</option>
              {timeframes.map((timeframe) => (
                <option
                  key={timeframe.timeframe_id}
                  value={timeframe.timeframe_id}
                >
                  {(timeframe.name || timeframe.timeframe_id) +
                    ` (${timeframe.start_date} → ${timeframe.end_date})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow">
            <p className="text-sm text-slate-500">Loading dashboard...</p>
          </div>
        ) : !dashboard ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow">
            <p className="text-sm text-slate-500">
              No dashboard data available.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-6 xl:grid-cols-6">
              {[
                ["Total Tasks", dashboard.summary.total_tasks],
                ["Total Hours", dashboard.summary.total_hours],
                ["Active Projects", dashboard.summary.active_projects],
                ["Active People", dashboard.summary.active_people],
                ["Blockers", dashboard.summary.blockers_count],
                ["Insights", dashboard.summary.insights_count],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-slate-950">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard
                title="Project Effort Distribution"
                subtitle="Compare planned effort with actual execution."
              >
                <div className="space-y-3">
                  {dashboard.project_effort.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      No project activity found.
                    </div>
                  ) : (
                    dashboard.project_effort.map((item) => (
                      <div
                        key={item.project_id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {item.project_name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.task_count} task(s) • {item.total_hours}h
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">
                              {item.actual_effort_pct}%
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              Planned {item.planned_effort_pct}% • Gap{" "}
                              {item.gap}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="People Contribution"
                subtitle="Contribution summary by team member."
              >
                <div className="space-y-3">
                  {dashboard.people_contribution.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      No people contribution found.
                    </div>
                  ) : (
                    dashboard.people_contribution.map((person) => (
                      <div
                        key={person.person_id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {person.person_name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {person.task_count} task(s) •{" "}
                              {person.blockers_count} blocker(s)
                              {" • "}
                              {person.insights_count} insight(s)
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {person.total_hours}h
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionCard
                title="Objective Activity"
                subtitle="Work distribution across objectives."
                className="h-full"
              >
                <div className="mb-5 max-w-sm">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Project Filter
                  </label>
                  <select
                    value={selectedProjectForObjectives}
                    onChange={(e) =>
                      setSelectedProjectForObjectives(e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                  >
                    <option value="ALL">All Projects</option>
                    {projectOptions.map((project) => (
                      <option
                        key={project.project_id}
                        value={project.project_id}
                      >
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredObjectiveEffort.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      No objective activity found.
                    </div>
                  ) : (
                    filteredObjectiveEffort.map((item) => (
                      <div
                        key={item.objective_id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {item.objective_name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.project_name} • {item.task_count} task(s)
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {item.actual_effort_pct}%
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              <div className="space-y-6">
                <SectionCard
                  title="Blockers"
                  subtitle="Tasks flagged as blocked in the selected timeframe."
                >
                  <div className="space-y-3">
                    {dashboard.blockers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        No blockers found.
                      </div>
                    ) : (
                      dashboard.blockers.map((item) => (
                        <div
                          key={item.task_id}
                          className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
                        >
                          <div className="text-sm font-medium text-slate-900">
                            {item.person_name} • {item.project_name} •{" "}
                            {item.objective_name}
                          </div>
                          <div className="mt-2 text-sm text-slate-700">
                            {item.blocker_description}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Insights"
                  subtitle="Learnings captured during the selected timeframe."
                >
                  <div className="space-y-3">
                    {dashboard.insights.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        No insights found.
                      </div>
                    ) : (
                      dashboard.insights.map((item) => (
                        <div
                          key={item.task_id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="text-sm font-medium text-slate-900">
                            {item.person_name} • {item.project_name} •{" "}
                            {item.objective_name}
                          </div>
                          <div className="mt-2 text-sm text-slate-700">
                            {item.insight}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
