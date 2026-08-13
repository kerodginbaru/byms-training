import { requirePermission } from "@/lib/auth/rbac";
import { getDashboardStats } from "@/lib/services/admin-actions";
import { formatCurrencyETB } from "@/lib/utils/labels";
import { DashboardCard } from "@/components/admin/dashboard-card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requirePermission("registrations:read");
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-900/60">Overview of registrations, payments, and capacity.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard label="Total Registrations" value={stats.total} />
        <DashboardCard label="Pending" value={stats.pending} tone="amber" />
        <DashboardCard label="Approved" value={stats.approved} tone="green" />
        <DashboardCard label="Rejected" value={stats.rejected} tone="red" />
        <DashboardCard label="Students" value={stats.students} />
        <DashboardCard label="Employees" value={stats.employees} />
        <DashboardCard label="Payments Pending" value={stats.paymentsPending} tone="amber" />
        <DashboardCard label="Total Verified Payments" value={formatCurrencyETB(stats.totalPaymentsVerified)} />
        <DashboardCard label="Available Seats" value={stats.availableSeats} tone="green" />
        <DashboardCard label="Full Schedules" value={stats.fullSchedules} tone="red" />
      </div>
    </div>
  );
}
