export type TaskType =
  | "Experiment"
  | "Development"
  | "Testing"
  | "Procurement"
  | "Fabrication"
  | "Analysis";

export type TaskStatus = "Done" | "In Progress" | "Blocked" | "Dropped";

export type Task = {
  task_id: string;
  date: string;
  person_id: string;
  person_name: string;
  project_id: string;
  project_name: string;
  objective_id: string;
  objective_name: string;
  description: string;
  task_type?: TaskType;
  status: TaskStatus;
  effort_hours?: number;
  blocker_flag: boolean;
  blocker_description?: string;
  insight?: string;
  created_at: string;
  updated_at: string;
};
