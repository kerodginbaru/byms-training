import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublicAdminPage =
    pathname === "/admin/forgot-password" || pathname === "/admin/reset-password";
  const isPublicAdminApiRoute =
    pathname === "/api/admin/forgot-password" || pathname === "/api/admin/reset-password";

  const isAdminRoute =
    pathname.startsWith("/admin") && pathname !== "/admin/login" && !isPublicAdminPage;
  const isAdminApiRoute =
    pathname.startsWith("/api/admin") &&
    pathname !== "/api/admin/login" &&
    !isPublicAdminApiRoute;

  if (!isAdminRoute && !isAdminApiRoute) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);

  if (!session) {
    if (isAdminApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fine-grained role checks happen server-side in each page/route via
  // lib/auth/rbac.ts's requirePermission(). Middleware only guarantees that
  // an authenticated session exists before any admin code runs.
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
