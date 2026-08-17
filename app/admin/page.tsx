import { requirePermission } from "@/lib/auth/rbac";
import { getDashboardStats } from "@/lib/services/admin-actions";
import { PACKAGE_LABELS } from "@/components/registration/types";
import { DashboardCard } from "@/components/admin/dashboard-card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requirePermission("registrations:read");
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-900/60">Overview of registrations and schedule capacity.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DashboardCard label="Total Registrations" value={stats.total} />
        <DashboardCard label="Students" value={stats.students} />
        <DashboardCard label="Employees" value={stats.employees} />
        <DashboardCard label="Available Seats (Regular)" value={stats.availableSeats} tone="green" />
        <DashboardCard label="Full Schedules" value={stats.fullSchedules} tone="red" />
        {Object.entries(stats.packageCounts).map(([pkg, count]) => (
          <DashboardCard
            key={pkg}
            label={PACKAGE_LABELS[pkg as keyof typeof PACKAGE_LABELS] ?? pkg}
            value={count}
          />
        ))}
      </div>
    </div>
  );
}