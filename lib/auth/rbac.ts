import "server-only";
import { redirect } from "next/navigation";
import { getSession, SessionPayload } from "./session";

type Role = SessionPayload["role"];

const PERMISSIONS: Record<string, Role[]> = {
  "registrations:read": ["SUPER_ADMIN", "REGISTRATION_ADMIN", "VIEWER"],
  "registrations:write": ["SUPER_ADMIN", "REGISTRATION_ADMIN"],
  "payments:read": ["SUPER_ADMIN", "REGISTRATION_ADMIN", "VIEWER"],
  "payments:write": ["SUPER_ADMIN", "REGISTRATION_ADMIN"],
  "schedules:write": ["SUPER_ADMIN", "REGISTRATION_ADMIN"],
  "settings:write": ["SUPER_ADMIN"],
  "admins:write": ["SUPER_ADMIN"],
  "reports:read": ["SUPER_ADMIN", "REGISTRATION_ADMIN", "VIEWER"]
};

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session as SessionPayload;
}

export async function requirePermission(permission: keyof typeof PERMISSIONS) {
  const session = await requireSession();
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles.includes(session.role)) {
    redirect("/admin?error=forbidden");
  }
  return session;
}

export function can(role: Role, permission: keyof typeof PERMISSIONS) {
  return PERMISSIONS[permission].includes(role);
}
