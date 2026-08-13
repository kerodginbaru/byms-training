import { NextRequest, NextResponse } from "next/server";
import { registrationSchema } from "@/lib/validation/registration";
import {
  createRegistration,
  ScheduleFullError,
  ScheduleUnavailableError,
  DuplicateRegistrationError
} from "@/lib/services/registration";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Please check the form and try again.", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  try {
    const result = await createRegistration(parsed.data);
    return NextResponse.json({ id: result.id, registrationNumber: result.registrationNumber }, { status: 201 });
  } catch (err) {
    if (err instanceof ScheduleFullError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof ScheduleUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof DuplicateRegistrationError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("POST /api/registrations failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
