import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { PACKAGE_LABELS } from "@/components/registration/types";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requirePermission("reports:read");

  const [byYear, byType, bySchedule, byPackage] = await Promise.all([
    prisma.registration.groupBy({ by: ["studentYear"], _count: { _all: true } }),
    prisma.registration.groupBy({ by: ["applicantType"], _count: { _all: true } }),
    prisma.registration.groupBy({ by: ["scheduleId"], _count: { _all: true } }),
    prisma.registration.groupBy({ by: ["packageType"], _count: { _all: true } })
  ]);

  const schedules = await prisma.schedule.findMany();
  const scheduleName = (id: string | null) => schedules.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-ink-900">Reports</h1>

      <ReportTable
        title="Registrations by Applicant Type"
        rows={byType.map((r) => [r.applicantType, String(r._count._all)])}
      />
      <ReportTable
        title="Registrations by Year"
        rows={byYear.filter((r) => r.studentYear).map((r) => [r.studentYear as string, String(r._count._all)])}
      />
      <ReportTable
        title="Registrations by Package"
        rows={byPackage.map((r) => [PACKAGE_LABELS[r.packageType], String(r._count._all)])}
      />
      <ReportTable
        title="Registrations by Schedule (Regular package only)"
        rows={bySchedule.filter((r) => r.scheduleId).map((r) => [scheduleName(r.scheduleId), String(r._count._all)])}
      />

      
        <a href="/api/admin/registrations/export"
        className="inline-block rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Export All Registrations (CSV)
      </a>
    </div>
  );
}

function ReportTable({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6">
      <h2 className="font-semibold text-ink-900">{title}</h2>
      <table className="mt-3 w-full text-sm">
        <tbody className="divide-y divide-brand-50">
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="py-2 text-ink-900/70">{label}</td>
              <td className="py-2 text-right font-medium">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}