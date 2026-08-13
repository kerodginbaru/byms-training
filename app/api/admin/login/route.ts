import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { adminLoginSchema } from "@/lib/validation/admin";
import { createSession } from "@/lib/auth/session";

// Simple in-memory rate limiting per server instance. For multi-instance
// production deployments, back this with Redis/Upstash instead.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email and password." }, { status: 422 });
  }

  const { email, password } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  // Constant-shape response whether the user exists or not, to avoid
  // leaking which emails are registered.
  if (!admin || !admin.isActive) {
    await bcrypt.compare(password, "$2a$10$invalidsaltinvalidsaltinvalidsal"); // dummy compare, timing consistency
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession({ adminId: admin.id, role: admin.role, email: admin.email });

  return NextResponse.json({ ok: true });
}
