import { NextRequest, NextResponse } from "next/server";
import { buildDashboardData } from "@/lib/dashboard/aggregate";
import { getActiveTimeframe } from "@/lib/sheets/timeframes";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    let start_date = searchParams.get("start_date") || "";
    let end_date = searchParams.get("end_date") || "";

    if (!start_date || !end_date) {
      const activeTimeframe = await getActiveTimeframe();

      if (!activeTimeframe) {
        return NextResponse.json(
          {
            success: false,
            error: "No active or latest timeframe found",
          },
          { status: 400 },
        );
      }

      start_date = activeTimeframe.start_date;
      end_date = activeTimeframe.end_date;
    }

    const dashboard = await buildDashboardData({
      start_date,
      end_date,
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
