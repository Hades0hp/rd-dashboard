import { NextRequest, NextResponse } from "next/server";
import {
  createTimeframe,
  getActiveTimeframe,
  getAllTimeframes,
} from "@/lib/sheets/timeframes";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "active") {
      const timeframe = await getActiveTimeframe();
      return NextResponse.json({ success: true, data: timeframe });
    }

    const timeframes = await getAllTimeframes();
    return NextResponse.json({ success: true, data: timeframes });
  } catch (error: any) {
    console.error("Error reading Timeframes sheet:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to read Timeframes sheet" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.start_date || !String(body.start_date).trim()) {
      return NextResponse.json(
        { success: false, error: "start_date is required" },
        { status: 400 },
      );
    }

    // Validate planned_effort if provided
    if (body.planned_effort && Array.isArray(body.planned_effort)) {
      const total = body.planned_effort.reduce(
        (sum: number, e: any) => sum + Number(e.planned_pct || 0),
        0,
      );
      if (Math.round(total) !== 100) {
        return NextResponse.json(
          { success: false, error: `Planned effort must total 100%. Got ${total}%` },
          { status: 400 },
        );
      }
    }

    const timeframe = await createTimeframe({
      name: body.name ? String(body.name).trim() : "",
      start_date: String(body.start_date).trim(),
      duration_days: body.duration_days ? Number(body.duration_days) : 7,
      created_by: body.created_by ? String(body.created_by).trim() : "",
      planned_effort: body.planned_effort ?? [],
    });

    return NextResponse.json({ success: true, data: timeframe });
  } catch (error: any) {
    console.error("Error creating timeframe:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create timeframe" },
      { status: 500 },
    );
  }
}