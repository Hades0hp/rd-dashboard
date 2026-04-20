import { NextResponse } from "next/server";
import { getAllBlockers } from "@/lib/sheets/blockers";

export async function GET() {
  try {
    const blockers = await getAllBlockers();

    return NextResponse.json({
      success: true,
      data: blockers,
    });
  } catch (error) {
    console.error("Error fetching blockers:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch blockers",
      },
      { status: 500 }
    );
  }
}