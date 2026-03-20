import { sheets, SPREADSHEET_ID } from "@/lib/sheets/client";
import { Project } from "@/lib/types/project";
import { createId } from "@/lib/utils/ids";
import { getNowISOString } from "@/lib/utils/dates";

const PROJECTS_RANGE = "Projects!A1:I1000";
const PROJECTS_APPEND_RANGE = "Projects!A:I";

function mapRowToProject(row: string[]): Project {
  return {
    project_id: row[0] || "",
    name: row[1] || "",
    objective: row[2] || "",
    priority: (row[3] as Project["priority"]) || "Medium",
    planned_effort_pct: row[4] ? Number(row[4]) : 0,
    status: (row[5] as Project["status"]) || "Active",
    progress_pct: row[6] ? Number(row[6]) : 0,
    created_at: row[7] || "",
    updated_at: row[8] || "",
  };
}

export async function getAllProjects(): Promise<Project[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: PROJECTS_RANGE,
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) return [];

  return rows
    .slice(1)
    .filter((row) => row[0])
    .map(mapRowToProject)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProjectById(
  projectId: string,
): Promise<Project | null> {
  const projects = await getAllProjects();
  return projects.find((project) => project.project_id === projectId) || null;
}

type CreateProjectInput = {
  name: string;
  objective?: string;
  priority?: Project["priority"];
  planned_effort_pct?: number;
  status?: Project["status"];
  progress_pct?: number;
};

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const now = getNowISOString();

  const project: Project = {
    project_id: createId("PRJ"),
    name: input.name,
    objective: input.objective || "",
    priority: input.priority || "Medium",
    planned_effort_pct: input.planned_effort_pct ?? 0,
    status: input.status || "Active",
    progress_pct: input.progress_pct ?? 0,
    created_at: now,
    updated_at: now,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: PROJECTS_APPEND_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          project.project_id,
          project.name,
          project.objective,
          project.priority,
          project.planned_effort_pct,
          project.status,
          project.progress_pct,
          project.created_at,
          project.updated_at,
        ],
      ],
    },
  });

  return project;
}

type UpdateProjectInput = {
  name: string;
  objective?: string;
  priority: Project["priority"];
  planned_effort_pct: number;
  status: Project["status"];
  progress_pct: number;
};

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: PROJECTS_RANGE,
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) {
    throw new Error("No projects found");
  }

  const rowIndex = rows.findIndex(
    (row, index) => index > 0 && row[0] === projectId,
  );

  if (rowIndex === -1) {
    throw new Error("Project not found");
  }

  const currentRow = rows[rowIndex];
  const now = getNowISOString();

  const updated: Project = {
    project_id: projectId,
    name: input.name,
    objective: input.objective || "",
    priority: input.priority,
    planned_effort_pct: input.planned_effort_pct,
    status: input.status,
    progress_pct: input.progress_pct,
    created_at: currentRow[7] || now,
    updated_at: now,
  };

  const sheetRowNumber = rowIndex + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Projects!A${sheetRowNumber}:I${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          updated.project_id,
          updated.name,
          updated.objective,
          updated.priority,
          updated.planned_effort_pct,
          updated.status,
          updated.progress_pct,
          updated.created_at,
          updated.updated_at,
        ],
      ],
    },
  });

  return updated;
}
