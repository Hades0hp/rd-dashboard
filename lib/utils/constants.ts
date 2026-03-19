export const SHEET_NAMES = {
  PROJECTS: "Projects",
  PEOPLE: "People",
  TASKS: "Tasks",
  TIMEFRAMES: "Timeframes",
  LOOKUPS: "Lookups",
} as const;

export const TASK_TYPES = [
  "Experiment",
  "Development",
  "Testing",
  "Procurement",
  "Fabrication",
  "Analysis",
] as const;

export const TASK_STATUSES = [
  "Done",
  "In Progress",
  "Blocked",
  "Dropped",
] as const;

export const PROJECT_STATUSES = ["Active", "Paused", "Archived"] as const;

export const PROJECT_PRIORITIES = ["High", "Medium", "Low"] as const;
