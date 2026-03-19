import { sheets, SPREADSHEET_ID } from "@/lib/sheets/client";
import { Task } from "@/lib/types/task";
import { createId } from "@/lib/utils/ids";
import { getNowISOString, getTodayDateString } from "@/lib/utils/dates";

const TASKS_RANGE = "Tasks!A1:Q5000";
const TASKS_APPEND_RANGE = "Tasks!A:Q";

function mapRowToTask(row: string[]): Task {
  return {
    task_id: row[0] || "",
    date: row[1] || "",
    person_id: row[2] || "",
    person_name: row[3] || "",
    project_id: row[4] || "",
    project_name: row[5] || "",
    objective_id: row[6] || "",
    objective_name: row[7] || "",
    description: row[8] || "",
    task_type: (row[9] as Task["task_type"]) || "Analysis",
    status: (row[10] as Task["status"]) || "Done",
    effort_hours: row[11] ? Number(row[11]) : 0,
    blocker_flag: row[12] === "true" || row[12] === "TRUE",
    blocker_description: row[13] || "",
    insight: row[14] || "",
    created_at: row[15] || "",
    updated_at: row[16] || "",
  };
}

export async function getAllTasks(): Promise<Task[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: TASKS_RANGE,
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  return rows
    .slice(1)
    .filter((row) => row[0])
    .map(mapRowToTask);
}

type GetTasksFilters = {
  project_id?: string;
  objective_id?: string;
  person_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
};

export async function getFilteredTasks(
  filters: GetTasksFilters,
): Promise<Task[]> {
  let tasks = await getAllTasks();

  if (filters.project_id) {
    tasks = tasks.filter((task) => task.project_id === filters.project_id);
  }

  if (filters.objective_id) {
    tasks = tasks.filter((task) => task.objective_id === filters.objective_id);
  }

  if (filters.person_id) {
    tasks = tasks.filter((task) => task.person_id === filters.person_id);
  }

  if (filters.status) {
    tasks = tasks.filter((task) => task.status === filters.status);
  }

  if (filters.start_date) {
    tasks = tasks.filter((task) => task.date >= filters.start_date!);
  }

  if (filters.end_date) {
    tasks = tasks.filter((task) => task.date <= filters.end_date!);
  }

  return tasks;
}

type CreateTaskInput = {
  date?: string;
  person_id: string;
  person_name: string;
  project_id: string;
  project_name: string;
  objective_id: string;
  objective_name: string;
  description: string;
  task_type?: Task["task_type"];
  status?: Task["status"];
  effort_hours?: number;
  blocker_flag?: boolean;
  blocker_description?: string;
  insight?: string;
};

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const now = getNowISOString();

  const task: Task = {
    task_id: createId("TSK"),
    date: input.date || getTodayDateString(),
    person_id: input.person_id,
    person_name: input.person_name,
    project_id: input.project_id,
    project_name: input.project_name,
    objective_id: input.objective_id,
    objective_name: input.objective_name,
    description: input.description,
    task_type: input.task_type || "Analysis",
    status: input.status || "Done",
    effort_hours: input.effort_hours ?? 0,
    blocker_flag: input.blocker_flag ?? false,
    blocker_description: input.blocker_description || "",
    insight: input.insight || "",
    created_at: now,
    updated_at: now,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: TASKS_APPEND_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          task.task_id,
          task.date,
          task.person_id,
          task.person_name,
          task.project_id,
          task.project_name,
          task.objective_id,
          task.objective_name,
          task.description,
          task.task_type,
          task.status,
          task.effort_hours,
          String(task.blocker_flag),
          task.blocker_description,
          task.insight,
          task.created_at,
          task.updated_at,
        ],
      ],
    },
  });

  return task;
}
