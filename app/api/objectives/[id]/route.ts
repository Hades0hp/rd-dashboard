import { NextRequest, NextResponse } from "next/server";
import {
  deleteObjective,
  getObjectiveById,
  updateObjective,
} from "@/lib/sheets/objectives";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const objective = await getObjectiveById(id);

    if (!objective) {
      return NextResponse.json(
        { success: false, error: "Objective not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: objective,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch objective",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.objective_name || !String(body.objective_name).trim()) {
      return NextResponse.json(
        { success: false, error: "objective_name is required" },
        { status: 400 },
      );
    }

    const updated = await updateObjective(id, {
      objective_name: String(body.objective_name).trim(),
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update objective",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    await deleteObjective(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete objective",
      },
      { status: 500 },
    );
  }
}
