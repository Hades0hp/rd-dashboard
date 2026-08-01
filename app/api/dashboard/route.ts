import { NextRequest, NextResponse } from "next/server";
import { buildDashboardData } from "@/lib/dashboard/aggregate";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframeIdsParam = searchParams.get("timeframe_ids") || "";

    const timeframe_ids = timeframeIdsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (timeframe_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one timeframe_id is required",
        },
        { status: 400 },
      );
    }

    const dashboard = await buildDashboardData({
      timeframe_ids,
    });

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    console.error("Error building dashboard:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to build dashboard",
      },
      { status: 500 },
    );
  }
}