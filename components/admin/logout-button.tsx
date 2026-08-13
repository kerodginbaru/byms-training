"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-brand-200 px-4 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
    >
      Sign Out
    </button>
  );
}
