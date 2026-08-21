import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const PRODUCTION_APP_URL = "https://byms-training-gilt.vercel.app";

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  const isLocalUrl = configuredUrl?.startsWith("http://localhost") || configuredUrl?.startsWith("http://127.0.0.1");
  if (process.env.NODE_ENV === "production" && isLocalUrl) return PRODUCTION_APP_URL;
  if (configuredUrl && !(process.env.NODE_ENV === "production" && isLocalUrl)) {
    return configuredUrl.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function createPasswordResetToken(adminId: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.adminUser.update({
    where: { id: adminId },
    data: {
      resetTokenHash: hashResetToken(token),
      resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS)
    }
  });
  return token;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your BYMS admin password",
      text: `Use this link to reset your password. It expires in 1 hour:\n\n${resetUrl}`
    })
  });

  if (!response.ok) {
    const details = await response.json().catch(() => null) as { message?: string; name?: string } | null;
    throw new Error(details?.message ?? details?.name ?? "The password reset email could not be sent.");
  }
}
