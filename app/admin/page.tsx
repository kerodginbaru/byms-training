import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { SESSION_LABELS, formatDays } from "@/lib/utils/labels";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requirePermission("registrations:read");

  const [schedules, studentCounts] = await Promise.all([
    prisma.schedule.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    }),
    prisma.registration.groupBy({
      by: ["scheduleId"],
      where: { applicantType: "STUDENT", scheduleId: { not: null } },
      _count: { _all: true }
    })
  ]);

  const countBySchedule = new Map(
    studentCounts.map((item) => [item.scheduleId, item._count._all])
  );

  const shiftCards = schedules.map((schedule) => ({
    ...schedule,
    studentCount: countBySchedule.get(schedule.id) ?? 0
  }));

  const totalStudents = shiftCards.reduce((sum, shift) => sum + shift.studentCount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-700">Admin Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-ink-900">Students by shift</h1>
        </div>
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-ink-900/50">Total students</p>
          <p className="text-2xl font-bold text-brand-700">{totalStudents}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shiftCards.map((shift) => (
          <div key={shift.id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-900/50">Shift</p>
                <h2 className="mt-1 text-xl font-bold text-ink-900">{shift.name}</h2>
              </div>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-sm font-semibold text-brand-700">
                {shift.studentCount}
              </span>
            </div>

            <div className="mt-4 space-y-1 text-sm text-ink-900/70">
              <p><span className="font-medium">Session:</span> {SESSION_LABELS[shift.session] ?? shift.session}</p>
              <p><span className="font-medium">Time:</span> {shift.startTime}–{shift.endTime}</p>
              <p><span className="font-medium">Days:</span> {formatDays(shift.days)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}