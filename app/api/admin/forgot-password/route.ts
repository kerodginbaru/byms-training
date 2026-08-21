import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createPasswordResetToken,
  getAppUrl,
  sendPasswordResetEmail
} from "@/lib/auth/password-reset";
import { passwordResetRequestSchema } from "@/lib/validation/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = passwordResetRequestSchema.safeParse(body);
    const genericResponse = NextResponse.json({
      message: "If that email belongs to an active administrator, a reset link has been sent."
    });

    if (!parsed.success) return genericResponse;

    const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
    if (!admin || !admin.isActive) return genericResponse;

    const token = await createPasswordResetToken(admin.id);
    const resetUrl = `${getAppUrl()}/admin/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(admin.email, resetUrl);
    } catch (error) {
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { resetTokenHash: null, resetTokenExpiresAt: null }
      });
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Password reset email could not be sent." },
        { status: 503 }
      );
    }

    return genericResponse;
  } catch {
    return NextResponse.json(
      { error: "Password reset is temporarily unavailable. Check the database migration and email settings." },
      { status: 500 }
    );
  }
}