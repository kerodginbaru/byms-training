import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { SESSION_LABELS, formatDays } from "@/lib/utils/labels";
import { TRAININGS_OFFERED } from "@/components/registration/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requirePermission("registrations:read");

  const [schedules, studentRegistrations] = await Promise.all([
    prisma.schedule.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    }),
    prisma.registration.findMany({
      where: { applicantType: "STUDENT" },
      select: {
        id: true,
        scheduleId: true,
        packageType: true,
        preferredTime: true,
        department: true
      }
    })
  ]);

  const countByScheduleAndDepartment = new Map<string, number>();
  const preferredTimeCounts = new Map<string, {
    department: string | null;
    preferredTime: string;
    count: number;
  }>();

  for (const registration of studentRegistrations) {
    const department = registration.department ?? null;
    if (registration.scheduleId) {
      const key = JSON.stringify([registration.scheduleId, department]);
      countByScheduleAndDepartment.set(key, (countByScheduleAndDepartment.get(key) ?? 0) + 1);
      continue;
    }

    if (registration.packageType !== "REGULAR" && registration.preferredTime) {
      const key = registration.preferredTime.trim();
      const groupedKey = JSON.stringify([key, department]);
      const current = preferredTimeCounts.get(groupedKey);
      preferredTimeCounts.set(groupedKey, {
        department,
        preferredTime: key,
        count: (current?.count ?? 0) + 1
      });
    }
  }

  const shiftDepartments = Array.from(new Set(
    studentRegistrations.map((registration) => registration.department ?? "Unspecified instrument")
  ));
  if (shiftDepartments.length === 0) shiftDepartments.push(...TRAININGS_OFFERED);
  const departments = Array.from(new Set([
    ...TRAININGS_OFFERED,
    ...shiftDepartments
  ]));
  const regularShiftCards = schedules.flatMap((schedule) =>
    shiftDepartments.map((department) => ({
      id: `${schedule.id}-${department}`,
      name: schedule.name,
      department,
      session: schedule.session,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      days: schedule.days,
      studentCount: countByScheduleAndDepartment.get(JSON.stringify([
        schedule.id,
        department === "Unspecified instrument" ? null : department
      ])) ?? 0
    }))
  );

  const specialShiftCards = Array.from(preferredTimeCounts.values()).map((value) => ({
    id: `preferred-${value.department ?? "unknown"}-${value.preferredTime}`,
    name: `Special / ${value.preferredTime}`,
    department: value.department ?? "Unspecified instrument",
    session: null,
    startTime: null,
    endTime: null,
    days: [],
    studentCount: value.count
  }));

  const allShiftCards = [...regularShiftCards, ...specialShiftCards].sort((a, b) => a.name.localeCompare(b.name));
  const totalStudents = studentRegistrations.length;
  const instrumentTotals = studentRegistrations.reduce((totals, registration) => {
    const department = registration.department ?? "Unspecified instrument";
    totals.set(department, (totals.get(department) ?? 0) + 1);
    return totals;
  }, new Map<string, number>(TRAININGS_OFFERED.map((department) => [department, 0])));

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

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900">Students by instrument</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((department) => (
            <div key={department} className="rounded-xl border border-brand-100 bg-white px-4 py-3">
              <p className="text-sm text-ink-900/60">{department}</p>
              <p className="text-2xl font-bold text-brand-700">{instrumentTotals.get(department) ?? 0}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Regular shifts</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {regularShiftCards.map((shift) => (
              <div key={shift.id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-900/50">Shift</p>
                    <h3 className="mt-1 text-xl font-bold text-ink-900">
                      {shift.department} · {shift.name}
                    </h3>
                  </div>
                  <span className="rounded-full bg-brand-100 px-2.5 py-1 text-sm font-semibold text-brand-700">
                    {shift.studentCount}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-sm text-ink-900/70">
                  <p><span className="font-medium">Session:</span> {SESSION_LABELS[shift.session as keyof typeof SESSION_LABELS] ?? shift.session}</p>
                  <p><span className="font-medium">Time:</span> {shift.startTime}–{shift.endTime}</p>
                  <p><span className="font-medium">Days:</span> {shift.days.length ? formatDays(shift.days) : "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Special packages</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {specialShiftCards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-5 text-sm text-ink-900/60">
                No special-package student registrations yet.
              </div>
            ) : (
              specialShiftCards.map((shift) => (
                <div key={shift.id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink-900/50">Special package</p>
                      <h3 className="mt-1 text-xl font-bold text-ink-900">{shift.department} · {shift.name}</h3>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-700">
                      {shift.studentCount}
                    </span>
                  </div>

                  <div className="mt-4 text-sm text-ink-900/70">
                    <p>Included as a non-regular student registration.</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}