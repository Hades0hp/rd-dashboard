import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/sheets/projects";

export const runtime = "nodejs";

export async function GET() {
  try {
    const projects = await getAllProjects();

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error: any) {
    console.error("Error reading Projects sheet:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to read Projects sheet",
      },
      { status: 500 },
    );
  }
}
