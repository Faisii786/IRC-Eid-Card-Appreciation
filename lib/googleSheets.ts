import { google } from "googleapis";

export type GenerationRecord = {
  timestamp: string;
  name: string;
  email: string;
  arabicName: string;
  language: string;
  requestId: string;
};

const DEFAULT_SHEET_NAME = "Responses";
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getGoogleSheetsConfig() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME ?? DEFAULT_SHEET_NAME;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    return null;
  }

  return { clientEmail, privateKey, spreadsheetId, sheetName };
}

async function getSheetsClient() {
  const config = getGoogleSheetsConfig();
  if (!config) return null;

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: SCOPES,
  });

  await auth.authorize();
  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, ...config };
}

function toA1Range(sheetTitle: string): string {
  // Quote sheet names to safely support spaces/special characters.
  const escaped = sheetTitle.replace(/'/g, "''");
  return `'${escaped}'!A:F`;
}

async function resolveSheetTitle(client: Awaited<ReturnType<typeof getSheetsClient>>): Promise<string> {
  if (!client) return DEFAULT_SHEET_NAME;

  const configuredTitle = client.sheetName.trim();
  const metadata = await client.sheets.spreadsheets.get({
    spreadsheetId: client.spreadsheetId,
    fields: "sheets(properties(title))",
  });

  const titles =
    metadata.data.sheets
      ?.map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)) ?? [];

  if (titles.includes(configuredTitle)) return configuredTitle;
  if (titles.includes(DEFAULT_SHEET_NAME)) return DEFAULT_SHEET_NAME;
  return titles[0] ?? configuredTitle;
}

export async function appendGenerationRecord(record: GenerationRecord) {
  const client = await getSheetsClient();
  if (!client) {
    console.warn("Google Sheets env vars are missing; skipping response logging.");
    return { inserted: false, reason: "MISSING_ENV" as const };
  }

  const sheetTitle = await resolveSheetTitle(client);
  const normalizedEmail = record.email.trim().toLowerCase();

  const emailColumn = await client.sheets.spreadsheets.values.get({
    spreadsheetId: client.spreadsheetId,
    range: `'${sheetTitle.replace(/'/g, "''")}'!C:C`,
  });

  const existingEmails = (emailColumn.data.values ?? [])
    .flat()
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean);

  if (existingEmails.includes(normalizedEmail)) {
    return { inserted: false, reason: "DUPLICATE_EMAIL" as const };
  }

  await client.sheets.spreadsheets.values.append({
    spreadsheetId: client.spreadsheetId,
    range: toA1Range(sheetTitle),
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          record.timestamp,
          record.name,
          record.email,
          record.arabicName,
          record.language,
          record.requestId,
        ],
      ],
    },
  });

  return { inserted: true as const };
}

export async function readGenerationRecords(limit = 500): Promise<GenerationRecord[]> {
  const client = await getSheetsClient();
  if (!client) return [];
  const sheetTitle = await resolveSheetTitle(client);

  const response = await client.sheets.spreadsheets.values.get({
    spreadsheetId: client.spreadsheetId,
    range: toA1Range(sheetTitle),
  });

  const rows = response.data.values ?? [];
  if (rows.length === 0) return [];

  const dataRows = rows[0]?.[0]?.toLowerCase?.() === "timestamp" ? rows.slice(1) : rows;
  const recentRows = dataRows.slice(-limit).reverse();

  return recentRows.map((row) => ({
    timestamp: row[0] ?? "",
    name: row[1] ?? "",
    email: row[2] ?? "",
    arabicName: row[3] ?? "",
    language: row[4] ?? "",
    requestId: row[5] ?? "",
  }));
}
