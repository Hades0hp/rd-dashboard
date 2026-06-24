import { sheets, SPREADSHEET_ID } from "@/lib/sheets/client";
import { Task } from "@/lib/types/task";
import { createId } from "@/lib/utils/ids";
import { getNowISOString, getTodayDateString } from "@/lib/utils/dates";

// Columns A-Q = original 17 cols, R = blocker_ids (ignored), S = effort_hours_log
const TASKS_RANGE = "Tasks!A1:S5000";
const TASKS_APPEND_RANGE = "Tasks!A:S";

export type HoursLogEntry = {
  timeframe_id: string;
  hours: number;
  logged_at?: string;
};

function parseHoursLog(raw: string): HoursLogEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
    // row[17] = blocker_ids — skip it
    effort_hours_log: parseHoursLog(row[18] || ""),
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
    .map(mapRowToTask)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const tasks = await getAllTasks();
  return tasks.find((task) => task.task_id === taskId) || null;
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
    effort_hours_log: [],
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: TASKS_APPEND_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        task.task_id, task.date, task.person_id, task.person_name,
        task.project_id, task.project_name, task.objective_id, task.objective_name,
        task.description, task.task_type, task.status, task.effort_hours,
        String(task.blocker_flag), task.blocker_description, task.insight,
        task.created_at, task.updated_at,
        "", // col R = blocker_ids — leave blank
        JSON.stringify(task.effort_hours_log), // col S
      ]],
    },
  });

  return task;
}

type UpdateTaskInput = {
  date: string;
  person_id: string;
  person_name: string;
  project_id: string;
  project_name: string;
  objective_id: string;
  objective_name: string;
  description: string;
  task_type: Task["task_type"];
  status: Task["status"];
  effort_hours: number;
  blocker_flag: boolean;
  blocker_description?: string;
  insight?: string;
  timeframe_hours?: { timeframe_id: string; hours: number };
};

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: TASKS_RANGE,
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) {
    throw new Error("No tasks found");
  }

  const rowIndex = rows.findIndex(
    (row, index) => index > 0 && row[0] === taskId,
  );

  if (rowIndex === -1) {
    throw new Error("Task not found");
  }

  const currentRow = rows[rowIndex];
  const now = getNowISOString();

  // Update hours log if timeframe_hours provided
let hoursLog = parseHoursLog(currentRow[18] || "");
const existingTotalHours = Number(currentRow[11] || 0);

if (
  input.timeframe_hours &&
  Number(input.timeframe_hours.hours) > 0
) {
console.log("TASK DATE:", currentRow[1]);

console.log(
  "CURRENT TIMEFRAME:",
  input.timeframe_hours?.timeframe_id
);
  // Legacy task with no sprint history yet
  if (
  hoursLog.length === 0 &&
  existingTotalHours > 0
) {
  hoursLog.push({
    timeframe_id:
      input.timeframe_hours?.timeframe_id ||
      "Previous hours",
    hours: existingTotalHours,
    logged_at: currentRow[15] || now,
  });
}

  const { timeframe_id, hours } = input.timeframe_hours;

const existingEntry = hoursLog.find(
  (entry) => entry.timeframe_id === timeframe_id
);

if (existingEntry) {
  existingEntry.hours =
    Number(existingEntry.hours || 0) +
    Number(hours || 0);

  existingEntry.logged_at = now;
} else {
  hoursLog.push({
    timeframe_id,
    hours: Number(hours || 0),
    logged_at: now,
  });
}}
console.log(
  "HOURS LOG AFTER UPDATE",
  JSON.stringify(hoursLog, null, 2)
);
console.log(
  "HOURS LOG BEFORE SAVE",
  JSON.stringify(hoursLog, null, 2)
);

console.log(
  "TIMEFRAME HOURS RECEIVED",
  input.timeframe_hours
);
const totalEffortHours =
  hoursLog.length > 0
    ? hoursLog.reduce(
        (sum, entry) => sum + Number(entry.hours || 0),
        0
      )
    : existingTotalHours;
 
  const updated: Task = {
    task_id: taskId,
    date: input.date,
    person_id: input.person_id,
    person_name: input.person_name,
    project_id: input.project_id,
    project_name: input.project_name,
    objective_id: input.objective_id,
    objective_name: input.objective_name,
    description: input.description,
    task_type: input.task_type,
    status: input.status,
    effort_hours: totalEffortHours,
    blocker_flag: input.blocker_flag,
    blocker_description: input.blocker_description || "",
    insight: input.insight || "",
    created_at: currentRow[15] || now,
    updated_at: now,
    effort_hours_log: hoursLog,
  };

  const sheetRowNumber = rowIndex + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Tasks!A${sheetRowNumber}:S${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        updated.task_id, updated.date, updated.person_id, updated.person_name,
        updated.project_id, updated.project_name, updated.objective_id, updated.objective_name,
        updated.description, updated.task_type, updated.status, updated.effort_hours,
        String(updated.blocker_flag), updated.blocker_description, updated.insight,
        updated.created_at, updated.updated_at,
        currentRow[17] || "", // col R = blocker_ids — preserve existing value
        JSON.stringify(updated.effort_hours_log), // col S
      ]],
    },
  });

  return updated;
}