"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "./logout-button";
import { AdminMobileNav } from "./mobile-nav";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/schedules", label: "Schedules" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Admin Users" }
];

export function AdminShell({
  children,
  email,
  role
}: {
  children: React.ReactNode;
  email?: string;
  role?: string;
}) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-brand-50/30">
      <aside className="hidden w-60 shrink-0 border-r border-brand-100 bg-white p-5 lg:block">
        <p className="amharic text-lg font-bold text-brand-700">ቤተ-ያሬድ አስተዳደር</p>
        <nav className="mt-6 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-900/70 transition hover:bg-brand-50 hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <AdminMobileNav nav={NAV} />
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-white px-4 py-3 sm:px-6">
          <p className="min-w-0 break-all text-xs text-ink-900/60 sm:text-sm">
            Signed in as <span className="font-medium text-ink-900">{email}</span> ·{" "}
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
              {role}
            </span>
          </p>
          <AdminLogoutButton />
        </header>
        <main className="min-w-0 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}