import { NextRequest, NextResponse } from "next/server";
import { getPersonById, updatePerson } from "@/lib/sheets/people";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const person = await getPersonById(id);

    if (!person) {
      return NextResponse.json(
        { success: false, error: "Person not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: person,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch person",
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

    const updated = await updatePerson(id, {
      name: String(body.name).trim(),
      role: body.role ? String(body.role).trim() : "",
      email: body.email ? String(body.email).trim() : "",
      status: body.status || "Active",
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update person",
      },
      { status: 500 },
    );
  }
}
