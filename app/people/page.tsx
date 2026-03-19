import { NextResponse } from "next/server";
import { getAllPeople } from "@/lib/sheets/people";

export const runtime = "nodejs";

export async function GET() {
  try {
    const people = await getAllPeople();

    return NextResponse.json({
      success: true,
      data: people,
    });
  } catch (error: any) {
    console.error("Error reading People sheet:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to read People sheet",
      },
      { status: 500 },
    );
  }
}
