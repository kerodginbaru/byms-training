import Link from "next/link";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { SESSION_LABELS, formatDays } from "@/lib/utils/labels";
import { TRAININGS_OFFERED } from "@/components/registration/types";

export const dynamic = "force-dynamic";

const INSTRUMENTS = TRAININGS_OFFERED;
type Instrument = (typeof INSTRUMENTS)[number];

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: { instrument?: string };
}) {
  await requirePermission("registrations:read");

  const selectedInstrument = INSTRUMENTS.find((instrument) => instrument === searchParams.instrument);
  const [schedules, registrations] = await Promise.all([
    prisma.schedule.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.registration.findMany({
      select: {
        department: true,
        scheduleId: true,
        packageType: true,
        preferredTime: true
      }
    })
  ]);

  const instrumentTotals = new Map<Instrument, number>(
    INSTRUMENTS.map((instrument) => [
      instrument,
      registrations.filter((registration) => registration.department === instrument).length
    ])
  );

  if (!selectedInstrument) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-700">Admin Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-ink-900">Registrations by instrument</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {INSTRUMENTS.map((instrument) => (
            <Link
              key={instrument}
              href={`/admin?instrument=${encodeURIComponent(instrument)}`}
              className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-ink-900">{instrument}</p>
              <p className="mt-2 text-3xl font-bold text-brand-700">{instrumentTotals.get(instrument)}</p>
              <p className="mt-1 text-sm text-ink-900/60">View shifts</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const registrationsForInstrument = registrations.filter(
    (registration) => registration.department === selectedInstrument
  );
  const countBySchedule = new Map<string, number>();
  const preferredTimeCounts = new Map<string, number>();
  let unassignedCount = 0;

  for (const registration of registrationsForInstrument) {
    if (registration.scheduleId) {
      countBySchedule.set(
        registration.scheduleId,
        (countBySchedule.get(registration.scheduleId) ?? 0) + 1
      );
    } else if (registration.packageType !== "REGULAR" && registration.preferredTime) {
      const preferredTime = registration.preferredTime.trim();
      preferredTimeCounts.set(preferredTime, (preferredTimeCounts.get(preferredTime) ?? 0) + 1);
    } else {
      unassignedCount += 1;
    }
  }

  const shifts = schedules.map((schedule) => ({
    id: schedule.id,
    title: `${schedule.days.length ? formatDays(schedule.days) : schedule.name} · ${SESSION_LABELS[schedule.session]} · ${selectedInstrument}`,
    time: `${schedule.startTime}–${schedule.endTime}`,
    total: countBySchedule.get(schedule.id) ?? 0
  }));
  const specialShifts = Array.from(preferredTimeCounts.entries()).map(([preferredTime, total]) => ({
    id: preferredTime,
    title: `${preferredTime} · ${selectedInstrument}`,
    time: null,
    total
  }));
  if (unassignedCount > 0) {
    specialShifts.push({
      id: "unassigned",
      title: `Unassigned shift · ${selectedInstrument}`,
      time: null,
      total: unassignedCount
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-700">Instrument</p>
          <h1 className="mt-2 text-2xl font-bold text-ink-900">{selectedInstrument} shifts</h1>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          Back to instrument totals
        </Link>
      </div>

      <p className="text-sm text-ink-900/60">
        Total registrations: <span className="font-semibold text-ink-900">{instrumentTotals.get(selectedInstrument)}</span>
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shifts.map((shift) => (
          <div key={shift.id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-ink-900">{shift.title}</h2>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-sm font-semibold text-brand-700">
                {shift.total}
              </span>
            </div>
            <p className="mt-3 text-sm text-ink-900/60">{shift.time}</p>
          </div>
        ))}

        {specialShifts.map((shift) => (
          <div key={shift.id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-ink-900">{shift.title}</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-700">
                {shift.total}
              </span>
            </div>
          </div>
        ))}

        {shifts.length === 0 && specialShifts.length === 0 && (
          <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50 p-5 text-sm text-ink-900/60">
            No registrations for this instrument yet.
          </div>
        )}
      </div>
    </div>
  );
}
