export type ProjectPriority = "High" | "Medium" | "Low";
export type ProjectStatus = "Active" | "Paused" | "Archived";

export type Project = {
  project_id: string;
  name: string;
  objective?: string;
  priority?: ProjectPriority;
  planned_effort_pct?: number;
  status: ProjectStatus;
  progress_pct?: number;
  created_at: string;
  updated_at: string;
};
