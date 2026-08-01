export type PlannedEffortEntry = {
  project_id: string;
  project_name: string;
  planned_pct: number;
};

export type Timeframe = {
  timeframe_id: string;
  name?: string;
  start_date: string;
  duration_days: number;
  end_date: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  planned_effort: PlannedEffortEntry[]; // stored as JSON in col I
};

export type TimeframeInput = {
  start_date: string;
  duration_days: number;
  label?: string;
};