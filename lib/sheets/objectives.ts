import { sheets, SPREADSHEET_ID } from "@/lib/sheets/client";
import { Objective } from "@/lib/types/objective";
import { createId } from "@/lib/utils/ids";
import { getNowISOString } from "@/lib/utils/dates";

const OBJECTIVES_RANGE = "Objectives!A1:E5000";
const OBJECTIVES_APPEND_RANGE = "Objectives!A:E";

function mapRowToObjective(row: string[]): Objective {
  return {
    objective_id: row[0] || "",
    project_id: row[1] || "",
    objective_name: row[2] || "",
    created_at: row[3] || "",
    updated_at: row[4] || "",
  };
}

export async function getAllObjectives(): Promise<Objective[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: OBJECTIVES_RANGE,
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  return rows
    .slice(1)
    .filter((row) => row[0])
    .map(mapRowToObjective);
}

export async function getObjectiveById(
  objectiveId: string,
): Promise<Objective | null> {
  const objectives = await getAllObjectives();
  return objectives.find((o) => o.objective_id === objectiveId) || null;
}

export async function getObjectivesByProjectId(
  projectId: string,
): Promise<Objective[]> {
  const objectives = await getAllObjectives();
  return objectives.filter((objective) => objective.project_id === projectId);
}

type CreateObjectiveInput = {
  project_id: string;
  objective_name: string;
};

export async function createObjective(
  input: CreateObjectiveInput,
): Promise<Objective> {
  const now = getNowISOString();

  const objective: Objective = {
    objective_id: createId("OBJ"),
    project_id: input.project_id,
    objective_name: input.objective_name,
    created_at: now,
    updated_at: now,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: OBJECTIVES_APPEND_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          objective.objective_id,
          objective.project_id,
          objective.objective_name,
          objective.created_at,
          objective.updated_at,
        ],
      ],
    },
  });

  return objective;
}

export async function updateObjective(
  objectiveId: string,
  input: { objective_name: string },
): Promise<Objective> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: OBJECTIVES_RANGE,
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) {
    throw new Error("No objectives found");
  }

  const rowIndex = rows.findIndex(
    (row, index) => index > 0 && row[0] === objectiveId,
  );

  if (rowIndex === -1) {
    throw new Error("Objective not found");
  }

  const currentRow = rows[rowIndex];
  const now = getNowISOString();

  const updated: Objective = {
    objective_id: objectiveId,
    project_id: currentRow[1] || "",
    objective_name: input.objective_name,
    created_at: currentRow[3] || now,
    updated_at: now,
  };

  const sheetRowNumber = rowIndex + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Objectives!A${sheetRowNumber}:E${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          updated.objective_id,
          updated.project_id,
          updated.objective_name,
          updated.created_at,
          updated.updated_at,
        ],
      ],
    },
  });

  return updated;
}

export async function deleteObjective(objectiveId: string): Promise<void> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: OBJECTIVES_RANGE,
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) {
    throw new Error("No objectives found");
  }

  const rowIndex = rows.findIndex(
    (row, index) => index > 0 && row[0] === objectiveId,
  );

  if (rowIndex === -1) {
    throw new Error("Objective not found");
  }

  const remainingRows = [
    rows[0],
    ...rows.slice(1).filter((row) => row[0] !== objectiveId),
  ];

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "Objectives!A:E",
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Objectives!A1:E" + remainingRows.length,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: remainingRows,
    },
  });
}
