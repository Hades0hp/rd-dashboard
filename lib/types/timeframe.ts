export type Timeframe = {
  timeframe_id: string;
  name?: string;
  start_date: string;
  duration_days: number;
  end_date: string;
  created_by?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type TimeframeInput = {
  start_date: string;
  duration_days: number;
  label?: string;
};
