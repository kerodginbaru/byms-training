import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { AdminLogoutButton } from "@/components/admin/logout-button";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/schedules", label: "Schedules" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Admin Users" }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

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

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-brand-100 bg-white px-6">
          <p className="text-sm text-ink-900/60">
            Signed in as <span className="font-medium text-ink-900">{session?.email}</span> ·{" "}
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
              {session?.role}
            </span>
          </p>
          <AdminLogoutButton />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
