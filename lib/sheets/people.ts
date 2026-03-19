import { sheets, SPREADSHEET_ID } from "@/lib/sheets/client";
import { Person } from "@/lib/types/person";
import { createId } from "@/lib/utils/ids";
import { getNowISOString } from "@/lib/utils/dates";

const PEOPLE_RANGE = "People!A1:G1000";
const PEOPLE_APPEND_RANGE = "People!A:G";

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
    .map(mapRowToPerson)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPersonById(personId: string): Promise<Person | null> {
  const people = await getAllPeople();
  return people.find((person) => person.person_id === personId) || null;
}

type CreatePersonInput = {
  name: string;
  role?: string;
  email?: string;
  status?: Person["status"];
};

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const now = getNowISOString();

  const person: Person = {
    person_id: createId("PER"),
    name: input.name,
    role: input.role || "",
    email: input.email || "",
    status: input.status || "Active",
    created_at: now,
    updated_at: now,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: PEOPLE_APPEND_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          person.person_id,
          person.name,
          person.role,
          person.email,
          person.status,
          person.created_at,
          person.updated_at,
        ],
      ],
    },
  });

  return person;
}

type UpdatePersonInput = {
  name: string;
  role?: string;
  email?: string;
  status: Person["status"];
};

export async function updatePerson(
  personId: string,
  input: UpdatePersonInput,
): Promise<Person> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: PEOPLE_RANGE,
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) {
    throw new Error("No people found");
  }

  const rowIndex = rows.findIndex(
    (row, index) => index > 0 && row[0] === personId,
  );

  if (rowIndex === -1) {
    throw new Error("Person not found");
  }

  const currentRow = rows[rowIndex];
  const now = getNowISOString();

  const updated: Person = {
    person_id: personId,
    name: input.name,
    role: input.role || "",
    email: input.email || "",
    status: input.status,
    created_at: currentRow[5] || now,
    updated_at: now,
  };

  const sheetRowNumber = rowIndex + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `People!A${sheetRowNumber}:G${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          updated.person_id,
          updated.name,
          updated.role,
          updated.email,
          updated.status,
          updated.created_at,
          updated.updated_at,
        ],
      ],
    },
  });

  return updated;
}
