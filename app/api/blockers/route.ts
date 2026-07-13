import { NextRequest, NextResponse } from "next/server";
import {
  getAllBlockers,
  createProjectBlocker,
} from "@/lib/sheets/blockers";

export async function GET() {
  try {
    const blockers = await getAllBlockers();

    return NextResponse.json({
      success: true,
      data: blockers,
    });
  } catch (error) {
    console.error("Error fetching blockers:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch blockers",
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
      "raised_by",
      "project_id",
      "project_name",
      "blocker_title",
      "blocker_description",
    ];

    for (const field of requiredFields) {
      if (!body[field] || !String(body[field]).trim()) {
        return NextResponse.json(
          {
            success: false,
            error: `${field} is required`,
          },
          { status: 400 }
        );
      }
    }

   await createProjectBlocker({
  blocker_id: `BLK-${Date.now()}`,
  person_id: body.person_id,
  person_name: body.person_name,
  raised_by: body.raised_by,
  project_id: body.project_id,
  project_name: body.project_name,
  blocker_title: body.blocker_title,
  blocker_description: body.blocker_description,
  assigned_to_resolve: body.assigned_to_resolve || "",
  blocker_status: body.blocker_status || "Open",
  resolution_notes: "",
  created_at: new Date().toISOString(),
});

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create blocker",
      },
      { status: 500 }
    );
  }
}