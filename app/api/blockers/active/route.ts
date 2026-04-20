import { NextResponse } from "next/server";
import { getActiveBlockers } from "@/lib/sheets/blockers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const blockers = await getActiveBlockers();

    return NextResponse.json({
      success: true,
      data: blockers,
    });
  } catch (error: any) {
    console.error("Error reading active blockers:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to read active blockers",
      },
      { status: 500 }
    );
  }
}