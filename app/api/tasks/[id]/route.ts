import { NextRequest, NextResponse } from "next/server";
import { getTaskById, updateTask } from "@/lib/sheets/tasks";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch task",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();

    const requiredFields = [
      "date",
      "person_id",
      "person_name",
      "project_id",
      "project_name",
      "objective_id",
      "objective_name",
      "description",
      "task_type",
      "status",
    ];

    for (const field of requiredFields) {
      if (!body[field] || !String(body[field]).trim()) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 },
        );
      }
    }

    if (body.blocker_flag && !String(body.blocker_description || "").trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "blocker_description is required when blocker_flag is true",
        },
        { status: 400 },
      );
    }

    const updated = await updateTask(id, {
      date: String(body.date).trim(),
      person_id: String(body.person_id).trim(),
      person_name: String(body.person_name).trim(),
      project_id: String(body.project_id).trim(),
      project_name: String(body.project_name).trim(),
      objective_id: String(body.objective_id).trim(),
      objective_name: String(body.objective_name).trim(),
      description: String(body.description).trim(),
      task_type: body.task_type,
      status: body.status,
      effort_hours: body.effort_hours ? Number(body.effort_hours) : 0,
      blocker_flag: Boolean(body.blocker_flag),
      blocker_description: body.blocker_description
        ? String(body.blocker_description).trim()
        : "",
      insight: body.insight ? String(body.insight).trim() : "",
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update task",
      },
      { status: 500 },
    );
  }
}
