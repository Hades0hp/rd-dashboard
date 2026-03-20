import { NextRequest, NextResponse } from "next/server";
import { getProjectById, updateProject } from "@/lib/sheets/projects";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch project",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, error: "name is required" },
        { status: 400 },
      );
    }

    const updated = await updateProject(id, {
      name: String(body.name).trim(),
      objective: body.objective ? String(body.objective).trim() : "",
      priority: body.priority || "Medium",
      planned_effort_pct: body.planned_effort_pct
        ? Number(body.planned_effort_pct)
        : 0,
      status: body.status || "Active",
      progress_pct: body.progress_pct ? Number(body.progress_pct) : 0,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update project",
      },
      { status: 500 },
    );
  }
}
