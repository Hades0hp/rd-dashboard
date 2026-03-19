import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "Dashboard API working",
    timeframes: [],
  });
}
