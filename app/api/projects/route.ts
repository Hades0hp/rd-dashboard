import { NextRequest, NextResponse } from "next/server";
import { createProject, getAllProjects } from "@/lib/sheets/projects";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, error: "Project name is required" },
        { status: 400 },
      );
    }

    const project = await createProject({
      name: String(body.name).trim(),
      objective: body.objective ? String(body.objective).trim() : "",
      priority: body.priority || "Medium",
      planned_effort_pct: body.planned_effort_pct ?? 0,
      status: body.status || "Active",
      progress_pct: body.progress_pct ?? 0,
    });

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    console.error("Error creating project:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create project",
      },
      { status: 500 },
    );
  }
}
