import { NextRequest, NextResponse } from "next/server";
import { createTask, getFilteredTasks } from "@/lib/sheets/tasks";
import { createBlocker } from "@/lib/sheets/blockers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const tasks = await getFilteredTasks({
      project_id: searchParams.get("project_id") || undefined,
      objective_id: searchParams.get("objective_id") || undefined,
      person_id: searchParams.get("person_id") || undefined,
      status: searchParams.get("status") || undefined,
      start_date: searchParams.get("start_date") || undefined,
      end_date: searchParams.get("end_date") || undefined,
    });

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error: any) {
    console.error("Error reading Tasks sheet:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to read Tasks sheet",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const requiredFields = [
      "person_id",
      "person_name",
      "project_id",
      "project_name",
      "objective_id",
      "objective_name",
      "description",
    ];

    for (const field of requiredFields) {
      if (!body[field] || !String(body[field]).trim()) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    if (body.blocker_flag && !String(body.blocker_description || "").trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "blocker_description is required when blocker_flag is true",
        },
        { status: 400 }
      );
    }

    const task = await createTask({
      date: body.date,
      person_id: String(body.person_id).trim(),
      person_name: String(body.person_name).trim(),
      project_id: String(body.project_id).trim(),
      project_name: String(body.project_name).trim(),
      objective_id: String(body.objective_id).trim(),
      objective_name: String(body.objective_name).trim(),
      description: String(body.description).trim(),
      task_type: body.task_type || "Analysis",
      status: body.status || "Done",
      effort_hours: body.effort_hours ? Number(body.effort_hours) : 0,
      timeframe_id: body.timeframe_id,
      blocker_flag: Boolean(body.blocker_flag),
      blocker_description: body.blocker_description
        ? String(body.blocker_description).trim()
        : "",
      insight: body.insight ? String(body.insight).trim() : "",
    });

    if (body.blocker_flag) {
      await createBlocker({
        blocker_id: `BLK-${Date.now()}`,
        task_id: task.task_id,
        task_description: task.description,
        person_id: task.person_id,
        person_name: task.person_name,
        raised_by: task.person_name,
        project_id: task.project_id,
        project_name: task.project_name,
        objective_id: task.objective_id,
        objective_name: task.objective_name,
        blocker_title: body.blocker_title
          ? String(body.blocker_title).trim()
          : "",
        blocker_description: body.blocker_description
          ? String(body.blocker_description).trim()
          : "",
        assigned_to_resolve: body.assigned_to_resolve
          ? String(body.assigned_to_resolve).trim()
          : "",
        blocker_status: body.blocker_status
          ? String(body.blocker_status).trim()
          : "Open",
        resolution_notes: body.resolution_notes
          ? String(body.resolution_notes).trim()
          : "",
        created_at: new Date().toISOString(),
        resolved_at: "",
      });
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error("Error creating task:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create task",
      },
      { status: 500 }
    );
  }
}