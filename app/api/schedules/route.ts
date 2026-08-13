import { NextResponse } from "next/server";
import { getScheduleAvailability } from "@/lib/services/registration";

export async function GET() {
  try {
    const schedules = await getScheduleAvailability();
    return NextResponse.json({ schedules });
  } catch (err) {
    console.error("GET /api/schedules failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
