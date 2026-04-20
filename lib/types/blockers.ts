export type BlockerStatus = "Open" | "In Progress" | "Resolved";

export type Blocker = {
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
  blocker_status: BlockerStatus;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
};