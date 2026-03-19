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

  if (rows.length <= 1) {
    return [];
  }

  return rows
    .slice(1)
    .filter((row) => row[0])
    .map(mapRowToProject);
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
