import { NextRequest, NextResponse } from "next/server";
import { getTimeframeById, updateTimeframe } from "@/lib/sheets/timeframes";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const timeframe = await getTimeframeById(id);

    if (!timeframe) {
      return NextResponse.json(
        { success: false, error: "Timeframe not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: timeframe });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch timeframe" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.start_date || !String(body.start_date).trim()) {
      return NextResponse.json(
        { success: false, error: "start_date is required" },
        { status: 400 },
      );
    }

    // Validate planned_effort total if provided
    if (body.planned_effort && Array.isArray(body.planned_effort) && body.planned_effort.length > 0) {
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

    const updated = await updateTimeframe(id, {
      name: body.name ? String(body.name).trim() : "",
      start_date: String(body.start_date).trim(),
      duration_days: body.duration_days ? Number(body.duration_days) : 7,
      created_by: body.created_by ? String(body.created_by).trim() : "",
      planned_effort: body.planned_effort ?? undefined,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update timeframe" },
      { status: 500 },
    );
  }
}