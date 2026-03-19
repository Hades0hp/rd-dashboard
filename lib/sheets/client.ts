import { google } from "googleapis";

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

if (!clientEmail) {
  throw new Error("Missing GOOGLE_CLIENT_EMAIL");
}

if (!privateKey) {
  throw new Error("Missing GOOGLE_PRIVATE_KEY");
}

if (!spreadsheetId) {
  throw new Error("Missing GOOGLE_SHEETS_ID");
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
});

export const sheets = google.sheets({
  version: "v4",
  auth,
});

export const SPREADSHEET_ID = spreadsheetId;
