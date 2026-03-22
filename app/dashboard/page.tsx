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
};

type TimeframeDashboard = {
  timeframe: Timeframe;
  dashboard: DashboardData | null;
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

function timeframeLabel(tf: Timeframe) {
  return tf.name || `${tf.start_date} → ${tf.end_date}`;
}

export default function DashboardPage() {
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [items, setItems] = useState<TimeframeDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectForObjectives, setSelectedProjectForObjectives] =
    useState("ALL");

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);

      try {
        const [timeframesRes, activeRes] = await Promise.all([
          fetch("/api/timeframes"),
          fetch("/api/timeframes?mode=active"),
        ]);

        const timeframesJson = await timeframesRes.json();
        const activeJson = await activeRes.json();

        const allTimeframes: Timeframe[] = timeframesJson.data || [];
        setTimeframes(allTimeframes);

        let defaultIds: string[] = [];

        if (activeJson.data?.timeframe_id) {
          defaultIds = [activeJson.data.timeframe_id];
        } else if (allTimeframes.length > 0) {
          defaultIds = [allTimeframes[0].timeframe_id];
        }

        setSelectedIds(defaultIds);

        if (defaultIds.length > 0) {
          await loadDashboardsForIds(defaultIds, allTimeframes);
        } else {
          setItems([]);
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        setItems([]);
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  async function loadDashboardsForIds(
    ids: string[],
    allTimeframes = timeframes,
  ) {
    setLoading(true);

    try {
      const selectedTimeframes = allTimeframes
        .filter((t) => ids.includes(t.timeframe_id))
        .sort((a, b) => b.start_date.localeCompare(a.start_date));

      const dashboardResults = await Promise.all(
        selectedTimeframes.map(async (timeframe) => {
          const res = await fetch(
            `/api/dashboard?start_date=${timeframe.start_date}&end_date=${timeframe.end_date}`,
          );
          const json = await res.json();

          return {
            timeframe,
            dashboard: json.success ? json.data : null,
          };
        }),
      );

      setItems(dashboardResults);
      setSelectedProjectForObjectives("ALL");
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function handleTimeframeToggle(timeframeId: string) {
    let nextIds: string[];

    if (selectedIds.includes(timeframeId)) {
      if (selectedIds.length === 1) return;
      nextIds = selectedIds.filter((id) => id !== timeframeId);
    } else {
      if (selectedIds.length >= 4) return;
      nextIds = [...selectedIds, timeframeId];
    }

    setSelectedIds(nextIds);
    loadDashboardsForIds(nextIds);
  }

  const validItems = useMemo(
    () => items.filter((item) => item.dashboard),
    [items],
  ) as Array<{ timeframe: Timeframe; dashboard: DashboardData }>;

  const combined = useMemo(() => {
    if (validItems.length === 0) return null;

    let totalTasks = 0;
    let totalHours = 0;
    let blockers = 0;
    let insights = 0;

    const projectMap = new Map<
      string,
      {
        project_id: string;
        project_name: string;
        total_hours: number;
        task_count: number;
        planned_effort_sum: number;
        timeframe_count: number;
      }
    >();

    const objectiveMap = new Map<
      string,
      {
        key: string;
        objective_id: string;
        objective_name: string;
        project_name: string;
        task_count: number;
        total_hours: number;
      }
    >();

    const peopleMap = new Map<
      string,
      {
        person_id: string;
        person_name: string;
        total_hours: number;
        task_count: number;
        blockers_count: number;
        insights_count: number;
      }
    >();

    const blockersList: DashboardData["blockers"] = [];
    const insightsList: DashboardData["insights"] = [];

    const projectSet = new Set<string>();
    const peopleSet = new Set<string>();

    for (const item of validItems) {
      const d = item.dashboard;

      totalTasks += d.summary.total_tasks;
      totalHours += d.summary.total_hours;
      blockers += d.summary.blockers_count;
      insights += d.summary.insights_count;

      d.project_effort.forEach((p) => {
        projectSet.add(p.project_id);

        const existing = projectMap.get(p.project_id) || {
          project_id: p.project_id,
          project_name: p.project_name,
          total_hours: 0,
          task_count: 0,
          planned_effort_sum: 0,
          timeframe_count: 0,
        };

        existing.total_hours += p.total_hours;
        existing.task_count += p.task_count;
        existing.planned_effort_sum += p.planned_effort_pct || 0;
        existing.timeframe_count += 1;

        projectMap.set(p.project_id, existing);
      });

      d.objective_effort.forEach((o) => {
        const key = `${o.project_name}__${o.objective_name}`;

        const existing = objectiveMap.get(key) || {
          key,
          objective_id: o.objective_id,
          objective_name: o.objective_name,
          project_name: o.project_name,
          task_count: 0,
          total_hours: 0,
        };

        existing.task_count += o.task_count;
        existing.total_hours += o.total_hours;

        objectiveMap.set(key, existing);
      });

      d.people_contribution.forEach((p) => {
        peopleSet.add(p.person_id);

        const existing = peopleMap.get(p.person_id) || {
          person_id: p.person_id,
          person_name: p.person_name,
          total_hours: 0,
          task_count: 0,
          blockers_count: 0,
          insights_count: 0,
        };

        existing.total_hours += p.total_hours;
        existing.task_count += p.task_count;
        existing.blockers_count += p.blockers_count;
        existing.insights_count += p.insights_count;

        peopleMap.set(p.person_id, existing);
      });

      blockersList.push(...d.blockers);
      insightsList.push(...d.insights);
    }

    const projectRows = Array.from(projectMap.values())
      .map((p) => {
        const actualEffortPct =
          totalHours > 0
            ? Number(((p.total_hours / totalHours) * 100).toFixed(1))
            : 0;

        const avgPlannedEffortPct =
          p.timeframe_count > 0
            ? Number((p.planned_effort_sum / p.timeframe_count).toFixed(1))
            : 0;

        return {
          project_id: p.project_id,
          project_name: p.project_name,
          actual_effort_pct: actualEffortPct,
          planned_effort_pct: avgPlannedEffortPct,
          gap: Number((avgPlannedEffortPct - actualEffortPct).toFixed(1)),
          total_hours: Number(p.total_hours.toFixed(1)),
          task_count: p.task_count,
        };
      })
      .sort((a, b) => b.actual_effort_pct - a.actual_effort_pct);

    const objectiveRows = Array.from(objectiveMap.values())
      .map((o) => ({
        ...o,
        task_count: o.task_count,
      }))
      .sort((a, b) => {
        if (b.task_count !== a.task_count) return b.task_count - a.task_count;
        const p = a.project_name.localeCompare(b.project_name);
        if (p !== 0) return p;
        return a.objective_name.localeCompare(b.objective_name);
      });

    const peopleRows = Array.from(peopleMap.values()).sort(
      (a, b) => b.total_hours - a.total_hours,
    );

    blockersList.sort((a, b) => b.date.localeCompare(a.date));
    insightsList.sort((a, b) => b.date.localeCompare(a.date));

    return {
      summary: {
        totalTasks,
        totalHours: Number(totalHours.toFixed(1)),
        activeProjects: projectSet.size,
        activePeople: peopleSet.size,
        blockers,
        insights,
      },
      projectRows,
      objectiveRows,
      peopleRows,
      blockersList,
      insightsList,
    };
  }, [validItems]);

  const projectOptions = useMemo(() => {
    if (!combined) return [];
    return combined.projectRows.map((row) => ({
      project_id: row.project_id,
      project_name: row.project_name,
    }));
  }, [combined]);

  const filteredObjectiveRows = useMemo(() => {
    if (!combined) return [];

    const selectedProjectName =
      selectedProjectForObjectives === "ALL"
        ? null
        : projectOptions.find(
            (p) => p.project_id === selectedProjectForObjectives,
          )?.project_name || null;

    return combined.objectiveRows.filter((row) =>
      selectedProjectName ? row.project_name === selectedProjectName : true,
    );
  }, [combined, selectedProjectForObjectives, projectOptions]);

  const selectedCount = selectedIds.length;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-5">
          <div>
            <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Dashboard
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Executive Dashboard
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Select 1 to 4 roundtables and view one comprehensive executive
              dashboard for the combined selected period.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Select Timeframes
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Choose between 1 and 4 timeframes to combine.
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {selectedCount}/4 selected
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {timeframes.map((timeframe) => {
                const selected = selectedIds.includes(timeframe.timeframe_id);

                return (
                  <button
                    key={timeframe.timeframe_id}
                    type="button"
                    onClick={() =>
                      handleTimeframeToggle(timeframe.timeframe_id)
                    }
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-semibold">
                      {timeframe.name || timeframe.timeframe_id}
                    </div>
                    <div
                      className={`mt-1 text-xs ${
                        selected ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {timeframe.start_date} → {timeframe.end_date}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow">
            <p className="text-sm text-slate-500">Loading dashboard...</p>
          </div>
        ) : !combined ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow">
            <p className="text-sm text-slate-500">
              No dashboard data available.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {[
                ["Total Tasks", combined.summary.totalTasks],
                ["Total Hours", combined.summary.totalHours],
                ["Active Projects", combined.summary.activeProjects],
                ["Active People", combined.summary.activePeople],
                ["Blockers", combined.summary.blockers],
                ["Insights", combined.summary.insights],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </div>
                  <div className="mt-2 text-3xl font-semibold leading-none text-slate-950">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <SectionCard
              title="Project Effort"
              subtitle="Combined actual effort % by project across selected timeframes."
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Project
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Actual Effort %
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Planned Effort %
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Gap %
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Hours
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {combined.projectRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-sm text-slate-500"
                          >
                            No project effort data found.
                          </td>
                        </tr>
                      ) : (
                        combined.projectRows.map((row) => (
                          <tr key={row.project_id}>
                            <td className="px-4 py-4 text-sm font-medium text-slate-900">
                              {row.project_name}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              {row.actual_effort_pct}%
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              {row.planned_effort_pct}%
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              {row.gap}%
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              {row.total_hours}h
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionCard
                title="Objective Activity"
                subtitle="Combined task count by objective across selected timeframes."
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

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Objective
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Project
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Task Count
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredObjectiveRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-8 text-center text-sm text-slate-500"
                            >
                              No objective activity found.
                            </td>
                          </tr>
                        ) : (
                          filteredObjectiveRows.map((row) => (
                            <tr key={row.key}>
                              <td className="px-4 py-4 text-sm font-medium text-slate-900">
                                {row.objective_name}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                {row.project_name}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                {row.task_count}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="People Contribution"
                subtitle="Combined hours contributed by person across selected timeframes."
              >
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Person
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Hours
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Tasks
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Blockers
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Insights
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {combined.peopleRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-sm text-slate-500"
                            >
                              No people contribution found.
                            </td>
                          </tr>
                        ) : (
                          combined.peopleRows.map((row) => (
                            <tr key={row.person_id}>
                              <td className="px-4 py-4 text-sm font-medium text-slate-900">
                                {row.person_name}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                {Number(row.total_hours.toFixed(1))}h
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                {row.task_count}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                {row.blockers_count}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                {row.insights_count}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard
                title="Blockers"
                subtitle="Combined blocker list across selected timeframes."
              >
                <div className="space-y-3">
                  {combined.blockersList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      No blockers found.
                    </div>
                  ) : (
                    combined.blockersList.map((blocker) => (
                      <div
                        key={blocker.task_id}
                        className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
                      >
                        <div className="text-sm font-medium text-slate-900">
                          {blocker.date} • {blocker.person_name} •{" "}
                          {blocker.project_name} • {blocker.objective_name}
                        </div>
                        <div className="mt-2 text-sm text-slate-700">
                          {blocker.blocker_description}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Insights"
                subtitle="Combined insight list across selected timeframes."
              >
                <div className="space-y-3">
                  {combined.insightsList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      No insights found.
                    </div>
                  ) : (
                    combined.insightsList.map((insight) => (
                      <div
                        key={insight.task_id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="text-sm font-medium text-slate-900">
                          {insight.date} • {insight.person_name} •{" "}
                          {insight.project_name} • {insight.objective_name}
                        </div>
                        <div className="mt-2 text-sm text-slate-700">
                          {insight.insight}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Combined Timeframe Selection
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {validItems.map((item) => (
                  <span
                    key={item.timeframe.timeframe_id}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                  >
                    {timeframeLabel(item.timeframe)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
