import { sheets, SPREADSHEET_ID } from "@/lib/sheets/client";
import { Project } from "@/lib/types/project";

const PROJECTS_RANGE = "Projects!A1:I1000";

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

  const dataRows = rows.slice(1);

  return dataRows.filter((row) => row[0]).map(mapRowToProject);
}
