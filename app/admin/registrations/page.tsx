import Link from "next/link";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { STUDENT_YEAR_LABELS } from "@/lib/utils/labels";
import { PACKAGE_LABELS } from "@/components/registration/types";
import { groupRegistrationsByShift } from "@/lib/utils/registration-grouping";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminRegistrationsPage({
  searchParams
}: {
  searchParams: {
    q?: string;
    type?: string;
    packageType?: string;
    scheduleId?: string;
    shiftId?: string;
    page?: string;
  };
}) {
  await requirePermission("registrations:read");

  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

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

  const [allRegistrations, total, schedules] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: { schedule: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.registration.count({ where }),
    prisma.schedule.findMany()
  ]);

  const shiftGroups = groupRegistrationsByShift(allRegistrations);
  const selectedShiftId = searchParams.shiftId ?? "";
  const selectedShift = shiftGroups.find((group) => group.id === selectedShiftId) ?? null;
  const visibleRegistrations = selectedShift ? selectedShift.members : allRegistrations;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
        
         <a href={`/api/admin/registrations/export${buildQuery({ page: undefined })}`}
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Export CSV
        </a>
      </div>

      <form className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" method="get">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search name / phone / number"
          className="col-span-2 rounded-lg border border-brand-200 px-3 py-2 text-sm lg:col-span-2"
        />
        <select name="type" defaultValue={searchParams.type ?? ""} className="rounded-lg border border-brand-200 px-3 py-2 text-sm">
          <option value="">All types</option>
          <option value="STUDENT">Student</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
        <select name="packageType" defaultValue={searchParams.packageType ?? ""} className="rounded-lg border border-brand-200 px-3 py-2 text-sm">
          <option value="">All packages</option>
          {Object.entries(PACKAGE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select name="scheduleId" defaultValue={searchParams.scheduleId ?? ""} className="rounded-lg border border-brand-200 px-3 py-2 text-sm">
          <option value="">All schedules</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-ink-900 px-3 py-2 text-sm font-medium text-white">
          Filter
        </button>
      </form>

      {!selectedShift && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shiftGroups.map((group) => (
            <Link
              key={group.id}
              href={buildQuery({ shiftId: group.id, page: undefined })}
              className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-900/50">Shift</p>
                  <h2 className="mt-1 text-lg font-bold text-ink-900">{group.name}</h2>
                </div>
                <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  {group.members.length}
                </span>
              </div>
              {group.session && (
                <p className="mt-2 text-sm text-ink-900/60">
                  {group.session === "MORNING" ? "Morning" : "Afternoon"}
                  {group.startTime && group.endTime ? ` · ${group.startTime}–${group.endTime}` : ""}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {!selectedShift && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">All registrations</h2>
          {allRegistrations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50 p-5 text-sm text-ink-900/60">
              No registrations found. Try changing or clearing the filters.
            </div>
          ) : (
            <>
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
                    {allRegistrations.map((r) => (
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
              <div className="space-y-3 md:hidden">
                {allRegistrations.map((r) => (
                  <Link
                    key={r.id}
                    href={`/admin/registrations/${r.id}`}
                    className="block rounded-xl border border-brand-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-ink-900/50">{r.registrationNumber}</span>
                      <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">
                        {PACKAGE_LABELS[r.packageType]}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-ink-900">{r.fullName}</p>
                    <p className="text-sm text-ink-900/60">{r.phone}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {selectedShift && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-900/50">Selected shift</p>
              <h2 className="text-xl font-bold text-ink-900">{selectedShift.name}</h2>
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

      {selectedShift && (
        <div className="mt-4 text-sm text-ink-900/60">
          {selectedShift.members.length} registered participant{selectedShift.members.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}   