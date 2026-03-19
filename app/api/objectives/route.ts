import { NextRequest, NextResponse } from "next/server";
import {
  createObjective,
  getAllObjectives,
  getObjectivesByProjectId,
} from "@/lib/sheets/objectives";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");

    const objectives = projectId
      ? await getObjectivesByProjectId(projectId)
      : await getAllObjectives();

    return NextResponse.json({
      success: true,
      data: objectives,
    });
  } catch (error: any) {
    console.error("Error reading Objectives sheet:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to read Objectives sheet",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.project_id || !String(body.project_id).trim()) {
      return NextResponse.json(
        { success: false, error: "project_id is required" },
        { status: 400 },
      );
    }

    if (!body.objective_name || !String(body.objective_name).trim()) {
      return NextResponse.json(
        { success: false, error: "objective_name is required" },
        { status: 400 },
      );
    }

    const objective = await createObjective({
      project_id: String(body.project_id).trim(),
      objective_name: String(body.objective_name).trim(),
    });

    return NextResponse.json({
      success: true,
      data: objective,
    });
  } catch (error: any) {
    console.error("Error creating objective:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create objective",
      },
      { status: 500 },
    );
  }
}
