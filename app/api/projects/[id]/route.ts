import { NextRequest, NextResponse } from "next/server";
import { getProjectById, updateProject } from "@/lib/sheets/projects";
import { getAllTimeframes } from "@/lib/sheets/timeframes";
import { getAllTasks } from "@/lib/sheets/tasks";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

function derivePriority(plannedPct: number): "High" | "Medium" | "Low" {
  if (plannedPct >= 30) return "High";
  if (plannedPct >= 10) return "Medium";
  return "Low";
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const project = await getProjectById(id);

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 },
      );
    }

    const timeframes = await getAllTimeframes();
    const tasks = await getAllTasks();

    // Active timeframe
    const today = new Date().toISOString().slice(0, 10);

    const activeTimeframe =
      timeframes.find(
        (t) =>
          t.start_date <= today &&
          t.end_date >= today,
      ) || null;

    // Planned Effort from active timeframe
    let plannedPct = 0;

    if (activeTimeframe?.planned_effort) {
      const effort = activeTimeframe.planned_effort.find(
        (e) => e.project_id === project.project_id,
      );

      if (effort) {
        plannedPct = effort.planned_pct;
      }
    }

    // Progress calculation
    const projectTasks = tasks.filter(
      (t) => t.project_id === project.project_id,
    );

    const doneHours = projectTasks
      .filter((t) => t.status === "Done")
      .reduce((sum, t) => sum + (t.effort_hours || 0), 0);

    const totalHours = projectTasks.reduce(
      (sum, t) => sum + (t.effort_hours || 0),
      0,
    );

    const progressPct =
      totalHours > 0
        ? Math.round((doneHours / totalHours) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        planned_effort_pct: plannedPct,
        priority: derivePriority(plannedPct),
        progress_pct: progressPct,
      },
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
        {
          success: false,
          error: "name is required",
        },
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
      progress_pct: body.progress_pct
        ? Number(body.progress_pct)
        : 0,
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