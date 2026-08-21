import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { hashResetToken } from "@/lib/auth/password-reset";
import { passwordResetSchema } from "@/lib/validation/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = passwordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "The reset link or password is invalid." }, { status: 422 });
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      resetTokenHash: hashResetToken(parsed.data.token),
      resetTokenExpiresAt: { gt: new Date() },
      isActive: true
    }
  });
  if (!admin) {
    return NextResponse.json({ error: "The reset link is invalid or expired." }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      resetTokenHash: null,
      resetTokenExpiresAt: null
    }
  });

  return NextResponse.json({ ok: true });
}