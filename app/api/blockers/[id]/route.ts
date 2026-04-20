import { NextRequest, NextResponse } from "next/server";
import { getAllBlockers, updateBlockerStatus } from "@/lib/sheets/blockers";
import { sheets, SPREADSHEET_ID } from "@/lib/sheets/client";

export const runtime = "nodejs";

async function findBlockerById(blockerId: string) {
  const blockers = await getAllBlockers();
  return blockers.find((b) => b.blocker_id === blockerId) || null;
}

async function findBlockerRowNumber(blockerId: string): Promise<number | null> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Blockers!A2:P5000",
  });

  const rows = response.data.values || [];

  for (let i = 0; i < rows.length; i++) {
    if ((rows[i][0] || "").trim() === blockerId.trim()) {
      return i + 2;
    }
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blocker = await findBlockerById(id);

    if (!blocker) {
      return NextResponse.json(
        { success: false, error: "Blocker not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: blocker,
    });
  } catch (error: any) {
    console.error("Error reading blocker:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to read blocker",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const blocker = await findBlockerById(id);

    if (!blocker) {
      return NextResponse.json(
        { success: false, error: "Blocker not found" },
        { status: 404 }
      );
    }

    const rowNumber = await findBlockerRowNumber(id);

    if (!rowNumber) {
      return NextResponse.json(
        { success: false, error: "Blocker row not found" },
        { status: 404 }
      );
    }

    const blocker_title = String(body.blocker_title ?? blocker.blocker_title ?? "").trim();
    const blocker_description = String(
      body.blocker_description ?? blocker.blocker_description ?? ""
    ).trim();
    const assigned_to_resolve = String(
      body.assigned_to_resolve ?? blocker.assigned_to_resolve ?? ""
    ).trim();
    const blocker_status = String(
      body.blocker_status ?? blocker.blocker_status ?? "Open"
    ).trim();
    const resolution_notes = String(
      body.resolution_notes ?? blocker.resolution_notes ?? ""
    ).trim();

    if (!blocker_title) {
      return NextResponse.json(
        { success: false, error: "blocker_title is required" },
        { status: 400 }
      );
    }

    if (!blocker_description) {
      return NextResponse.json(
        { success: false, error: "blocker_description is required" },
        { status: 400 }
      );
    }

    if (!assigned_to_resolve) {
      return NextResponse.json(
        { success: false, error: "assigned_to_resolve is required" },
        { status: 400 }
      );
    }

    if (blocker_status === "Resolved" && !resolution_notes) {
      return NextResponse.json(
        {
          success: false,
          error: "resolution_notes is required when blocker_status is Resolved",
        },
        { status: 400 }
      );
    }

    const resolved_at =
      blocker_status === "Resolved"
        ? blocker.resolved_at || new Date().toISOString()
        : "";

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Blockers!J${rowNumber}:P${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          blocker_title,
          blocker_description,
          assigned_to_resolve,
          blocker_status,
          resolution_notes,
          blocker.created_at || "",
          resolved_at,
        ]],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Blocker updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating blocker:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update blocker",
      },
      { status: 500 }
    );
  }
}