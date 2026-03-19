export type DashboardSummary = {
  total_tasks: number;
  active_projects: number;
  active_people: number;
  blockers_count: number;
  insights_count: number;
};

export type ProjectEffortItem = {
  project_id: string;
  project_name: string;
  actual_effort_pct: number;
};

export type AlignmentItem = {
  project_id: string;
  project_name: string;
  planned_effort_pct: number;
  actual_effort_pct: number;
  gap: number;
};

export type DashboardTimeframeResult = {
  label?: string;
  start_date: string;
  end_date: string;
  summary: DashboardSummary;
  project_effort: ProjectEffortItem[];
  alignment: AlignmentItem[];
};

export type DashboardResponse = {
  timeframes: DashboardTimeframeResult[];
};
