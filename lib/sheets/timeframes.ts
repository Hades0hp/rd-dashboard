import { sheets, SPREADSHEET_ID } from "@/lib/sheets/client";
import { Timeframe, PlannedEffortEntry } from "@/lib/types/timeframe";
import { createId } from "@/lib/utils/ids";
import {
  calculateEndDate,
  getNowISOString,
  getTodayDateString,
} from "@/lib/utils/dates";

const TIMEFRAMES_RANGE = "Timeframes!A1:I1000";
const TIMEFRAMES_APPEND_RANGE = "Timeframes!A:I";

function parsePlannedEffort(raw: string): PlannedEffortEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapRowToTimeframe(row: string[]): Timeframe {
  return {
    timeframe_id: row[0] || "",
    name: row[1] || "",
    start_date: row[2] || "",
    duration_days: row[3] ? Number(row[3]) : 7,
    end_date: row[4] || "",
    created_by: row[5] || "",
    created_at: row[6] || "",
    updated_at: row[7] || "",
    planned_effort: parsePlannedEffort(row[8] || ""),
  };
}

function sortTimeframesDesc(timeframes: Timeframe[]): Timeframe[] {
  return [...timeframes].sort((a, b) =>
    b.start_date.localeCompare(a.start_date),
  );
}

function doesOverlap(
  newStart: string,
  newEnd: string,
  existingStart: string,
  existingEnd: string,
): boolean {
  return newStart <= existingEnd && newEnd >= existingStart;
}

export async function getAllTimeframes(): Promise<Timeframe[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: TIMEFRAMES_RANGE,
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) return [];

  return sortTimeframesDesc(
    rows
      .slice(1)
      .filter((row) => row[0])
      .map(mapRowToTimeframe),
  );
}

export async function getTimeframeById(id: string): Promise<Timeframe | null> {
  const timeframes = await getAllTimeframes();
  return timeframes.find((t) => t.timeframe_id === id) || null;
}

export async function getActiveTimeframe(): Promise<Timeframe | null> {
  const timeframes = await getAllTimeframes();
  const today = getTodayDateString();

  const active = timeframes.find(
    (t) => t.start_date <= today && t.end_date >= today,
  );

  if (active) return active;
  return timeframes[0] || null;
}

type CreateTimeframeInput = {
  name?: string;
  start_date: string;
  duration_days?: number;
  created_by?: string;
  planned_effort?: PlannedEffortEntry[];
};

export async function createTimeframe(
  input: CreateTimeframeInput,
): Promise<Timeframe> {
  const now = getNowISOString();
  const duration = input.duration_days ?? 7;
  const endDate = calculateEndDate(input.start_date, duration);

  const existing = await getAllTimeframes();

  const overlapping = existing.find((t) =>
    doesOverlap(input.start_date, endDate, t.start_date, t.end_date),
  );

  if (overlapping) {
    throw new Error(
      `Timeframe overlaps with existing timeframe: ${overlapping.name || overlapping.timeframe_id}`,
    );
  }

  const plannedEffort = input.planned_effort ?? [];

  const timeframe: Timeframe = {
    timeframe_id: createId("TFR"),
    name: input.name || "",
    start_date: input.start_date,
    duration_days: duration,
    end_date: endDate,
    created_by: input.created_by || "",
    created_at: now,
    updated_at: now,
    planned_effort: plannedEffort,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: TIMEFRAMES_APPEND_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          timeframe.timeframe_id,
          timeframe.name,
          timeframe.start_date,
          timeframe.duration_days,
          timeframe.end_date,
          timeframe.created_by,
          timeframe.created_at,
          timeframe.updated_at,
          JSON.stringify(timeframe.planned_effort),
        ],
      ],
    },
  });

  return timeframe;
}

export async function updateTimeframe(
  timeframeId: string,
  input: {
    name?: string;
    start_date: string;
    duration_days: number;
    created_by?: string;
    planned_effort?: PlannedEffortEntry[];
  },
): Promise<Timeframe> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: TIMEFRAMES_RANGE,
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) throw new Error("No timeframes found");

  const rowIndex = rows.findIndex(
    (row, index) => index > 0 && row[0] === timeframeId,
  );

  if (rowIndex === -1) throw new Error("Timeframe not found");

  const now = getNowISOString();
  const endDate = calculateEndDate(input.start_date, input.duration_days);

  const existing = rows
    .slice(1)
    .filter((row) => row[0] && row[0] !== timeframeId)
    .map(mapRowToTimeframe);

  const overlapping = existing.find((t) =>
    doesOverlap(input.start_date, endDate, t.start_date, t.end_date),
  );

  if (overlapping) {
    throw new Error(
      `Timeframe overlaps with existing timeframe: ${overlapping.name || overlapping.timeframe_id}`,
    );
  }

  const currentRow = rows[rowIndex];

  // Keep existing planned_effort if not provided in update
  const plannedEffort =
    input.planned_effort ?? parsePlannedEffort(currentRow[8] || "");

  const updated: Timeframe = {
    timeframe_id: timeframeId,
    name: input.name ?? currentRow[1] ?? "",
    start_date: input.start_date,
    duration_days: input.duration_days,
    end_date: endDate,
    created_by: input.created_by ?? currentRow[5] ?? "",
    created_at: currentRow[6] || now,
    updated_at: now,
    planned_effort: plannedEffort,
  };

  const sheetRowNumber = rowIndex + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Timeframes!A${sheetRowNumber}:I${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          updated.timeframe_id,
          updated.name,
          updated.start_date,
          updated.duration_days,
          updated.end_date,
          updated.created_by,
          updated.created_at,
          updated.updated_at,
          JSON.stringify(updated.planned_effort),
        ],
      ],
    },
  });

  return updated;
}