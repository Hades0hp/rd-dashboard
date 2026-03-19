import { sheets, SPREADSHEET_ID } from "@/lib/sheets/client";
import { Person } from "@/lib/types/person";

const PEOPLE_RANGE = "People!A1:G1000";

function mapRowToPerson(row: string[]): Person {
  return {
    person_id: row[0] || "",
    name: row[1] || "",
    role: row[2] || "",
    email: row[3] || "",
    status: (row[4] as Person["status"]) || "Active",
    created_at: row[5] || "",
    updated_at: row[6] || "",
  };
}

export async function getAllPeople(): Promise<Person[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: PEOPLE_RANGE,
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  return rows
    .slice(1)
    .filter((row) => row[0])
    .map(mapRowToPerson);
}
