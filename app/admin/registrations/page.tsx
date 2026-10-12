import Link from "next/link";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { SESSION_LABELS, STUDENT_YEAR_LABELS, formatDays } from "@/lib/utils/labels";
import { PACKAGE_LABELS, TRAININGS_OFFERED } from "@/components/registration/types";
import { groupRegistrationsByShift } from "@/lib/utils/registration-grouping";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage({
  searchParams
}: {
  searchParams: {
    q?: string;
    type?: string;
    packageType?: string;
    scheduleId?: string;
    instrument?: string;
    shiftId?: string;
    page?: string;
  };
}) {
  await requirePermission("registrations:read");

  const where: Prisma.RegistrationWhereInput = {};

  if (searchParams.q) {
    where.OR = [
      { fullName: { contains: searchParams.q, mode: "insensitive" } },
      { phone: { contains: searchParams.q } },
      { registrationNumber: { contains: searchParams.q, mode: "insensitive" } }
    ];
  }
  if (searchParams.type) where.applicantType = searchParams.type as any;
  if (searchParams.packageType) where.packageType = searchParams.packageType as any;
  if (searchParams.scheduleId) where.scheduleId = searchParams.scheduleId;
  const selectedInstrument = TRAININGS_OFFERED.includes(searchParams.instrument ?? "")
    ? searchParams.instrument!
    : undefined;
  if (selectedInstrument) where.department = selectedInstrument;

  const [allRegistrations, instrumentRegistrations] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: { schedule: true },
      orderBy: { createdAt: "desc" }
    }),
    selectedInstrument
      ? Promise.resolve(null)
      : prisma.registration.findMany({
          select: { department: true }
        })
  ]);

  const shiftGroups = groupRegistrationsByShift(allRegistrations);
  const registrationsByInstrument = new Map(TRAININGS_OFFERED.map((instrument) => [instrument, 0]));
  for (const registration of instrumentRegistrations ?? []) {
    if (registration.department) {
      registrationsByInstrument.set(
        registration.department,
        (registrationsByInstrument.get(registration.department) ?? 0) + 1
      );
    }
  }
  const selectedShiftId = searchParams.shiftId ?? "";
  const selectedShift = shiftGroups.find((group) => group.id === selectedShiftId) ?? null;
  const visibleRegistrations = selectedShift ? selectedShift.members : allRegistrations;

  function buildQuery(patch: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { ...searchParams, ...patch };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    return `?${p.toString()}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900">Registrations</h1>
        {selectedInstrument && (
          <a href={`/api/admin/registrations/export${buildQuery({ page: undefined })}`}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Export CSV
          </a>
        )}
      </div>

      {!selectedInstrument && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Total registrations by instrument</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {TRAININGS_OFFERED.filter((instrument) => instrument === "በገና" || instrument === "ክራር").map((instrument) => (
              <Link
                key={instrument}
                href={buildQuery({ instrument, shiftId: undefined, page: undefined })}
                className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
              >
                <p className="text-lg font-semibold text-ink-900">{instrument}</p>
                <p className="mt-2 text-3xl font-bold text-brand-700">{registrationsByInstrument.get(instrument) ?? 0}</p>
                <p className="mt-1 text-sm text-ink-900/60">View shifts</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {selectedInstrument && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink-900">
            {selectedInstrument}{selectedShift ? ` · ${selectedShift.days?.length ? formatDays(selectedShift.days) : selectedShift.name}` : " shifts"}
          </h2>
          <Link
            href={buildQuery({ instrument: undefined, shiftId: undefined, page: undefined })}
            className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-medium text-brand-700"
          >
            {selectedShift ? "Back to shifts" : "Back to instrument totals"}
          </Link>
        </div>
      )}

      {selectedInstrument && !selectedShift && (
        <section className="mt-6">
          {shiftGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50 p-5 text-sm text-ink-900/60">
              No shifts or registrations for this instrument yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shiftGroups.map((group) => (
                <Link
                  key={group.id}
                  href={buildQuery({ instrument: selectedInstrument, shiftId: group.id, page: undefined })}
                  className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink-900/50">Shift</p>
                      <h2 className="mt-1 text-lg font-bold text-ink-900">
                        {group.days?.length ? formatDays(group.days) : group.name}
                        {group.session ? ` · ${SESSION_LABELS[group.session] ?? group.session}` : ""}
                        {group.instrument ? ` · ${group.instrument}` : ""}
                      </h2>
                    </div>
                    <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
                      {group.members.length}
                    </span>
                  </div>
                  {group.startTime && group.endTime && (
                    <p className="mt-2 text-sm text-ink-900/60">
                      {group.startTime}–{group.endTime}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedInstrument && selectedShift && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-900/50">Selected shift</p>
              <h2 className="text-xl font-bold text-ink-900">
                {selectedShift.days?.length ? formatDays(selectedShift.days) : selectedShift.name}
                {selectedShift.session ? ` · ${SESSION_LABELS[selectedShift.session] ?? selectedShift.session}` : ""}
                {selectedShift.instrument ? ` · ${selectedShift.instrument}` : ""}
              </h2>
            </div>
            <Link href={buildQuery({ shiftId: undefined, page: undefined })} className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-medium text-brand-700">
              Back to all shifts
            </Link>
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-brand-100 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-50 text-xs uppercase text-ink-900/50">
                <tr>
                  <th className="px-4 py-3">Reg. Number</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {visibleRegistrations.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-50/40">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{r.registrationNumber}</td>
                    <td className="px-4 py-3">{r.fullName}</td>
                    <td className="px-4 py-3">{r.phone}</td>
                    <td className="px-4 py-3">
                      {r.applicantType === "STUDENT" ? `Student${r.studentYear ? " · " + STUDENT_YEAR_LABELS[r.studentYear] : ""}` : "Employee"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
                        {PACKAGE_LABELS[r.packageType]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-900/60">
                      {new Intl.DateTimeFormat("en-GB", { dateStyle: "short" }).format(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/registrations/${r.id}`} className="font-medium text-brand-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 md:hidden">
            {visibleRegistrations.map((r) => (
              <Link
                key={r.id}
                href={`/admin/registrations/${r.id}`}
                className="block rounded-xl border border-brand-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-900/50">{r.registrationNumber}</span>
                  <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
                    {PACKAGE_LABELS[r.packageType]}
                  </span>
                </div>
                <p className="mt-1 font-medium text-ink-900">{r.fullName}</p>
                <p className="text-sm text-ink-900/60">{r.phone}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {selectedInstrument && selectedShift && (
        <div className="mt-4 text-sm text-ink-900/60">
          {selectedShift.members.length} registered participant{selectedShift.members.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}   