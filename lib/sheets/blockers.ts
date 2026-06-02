import { sheets, SPREADSHEET_ID } from "@/lib/sheets/client";
import type { Blocker } from "@/lib/types/blockers";

const BLOCKERS_RANGE = "Blockers!A2:P5000";
const BLOCKERS_APPEND_RANGE = "Blockers!A:P";

function mapRowToBlocker(row: string[]): Blocker {
  return {
    blocker_id: row[0] || "",
    task_id: row[1] || "",
    task_description: row[2] || "",
    person_id: row[3] || "",
    person_name: row[4] || "",
    project_id: row[5] || "",
    project_name: row[6] || "",
    objective_id: row[7] || "",
    objective_name: row[8] || "",
    blocker_title: row[9] || "",
    blocker_description: row[10] || "",
    assigned_to_resolve: row[11] || "",
    blocker_status: (row[12] as Blocker["blocker_status"]) || "Open",
    resolution_notes: row[13] || "",
    created_at: row[14] || "",
    resolved_at: row[15] || "",
  };
}

export async function getAllBlockers(): Promise<Blocker[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: BLOCKERS_RANGE,
  });

  const rows = response.data.values || [];
  return rows.map((row) => mapRowToBlocker(row));
}

export async function getBlockersByTaskId(taskId: string): Promise<Blocker[]> {
  const blockers = await getAllBlockers();
  return blockers.filter((blocker) => blocker.task_id === taskId);
}

export async function getActiveBlockers(): Promise<Blocker[]> {
  const blockers = await getAllBlockers();
  return blockers.filter(
    (blocker) =>
      blocker.blocker_status === "Open" ||
      blocker.blocker_status === "In Progress"
  );
}

export async function createBlocker(blocker: {
  blocker_id: string;
  task_id: string;
  task_description: string;
  person_id: string;
  person_name: string;
  project_id: string;
  project_name: string;
  objective_id: string;
  objective_name: string;
  blocker_title: string;
  blocker_description: string;
  assigned_to_resolve: string;
  blocker_status: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: BLOCKERS_APPEND_RANGE,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        blocker.blocker_id,
        blocker.task_id,
        blocker.task_description,
        blocker.person_id,
        blocker.person_name,
        blocker.project_id,
        blocker.project_name,
        blocker.objective_id,
        blocker.objective_name,
        blocker.blocker_title,
        blocker.blocker_description,
        blocker.assigned_to_resolve,
        blocker.blocker_status,
        blocker.resolution_notes || "",
        blocker.created_at,
        blocker.resolved_at || "",
      ]],
    },
  });
}

async function findBlockerRowNumber(blockerId: string): Promise<number | null> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: BLOCKERS_RANGE,
  });

  const rows = response.data.values || [];

  for (let i = 0; i < rows.length; i++) {
    if ((rows[i][0] || "").trim() === blockerId.trim()) {
      return i + 2; // data starts at row 2
    }
  }

  return null;
}

export async function updateBlockerStatus(input: {
  blocker_id: string;
  blocker_status: "Open" | "In Progress" | "Resolved";
  resolution_notes?: string;
}): Promise<void> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: BLOCKERS_RANGE,
  });

  const rows = response.data.values || [];
  let rowNumber: number | null = null;
  let createdAt = "";

  for (let i = 0; i < rows.length; i++) {
    if ((rows[i][0] || "").trim() === input.blocker_id.trim()) {
      rowNumber = i + 2;
      createdAt = rows[i][14] || "";
      break;
    }
  }

  if (!rowNumber) {
    throw new Error("Blocker not found");
  }

  const resolvedAt =
    input.blocker_status === "Resolved" ? new Date().toISOString() : "";

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Blockers!M${rowNumber}:P${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        input.blocker_status,
        input.resolution_notes || "",
        createdAt,
        resolvedAt,
      ]],
    },
  });
}