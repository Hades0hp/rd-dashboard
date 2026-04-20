import { NextResponse } from "next/server";
import { getBlockersByTaskId } from "@/lib/sheets/blockers";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const blockers = await getBlockersByTaskId(id);

    return NextResponse.json({
      success: true,
      data: blockers,
    });
  } catch (error: any) {
    console.error("Error fetching blockers:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch blockers",
      },
      { status: 500 }
    );
  }
}