import Link from "next/link";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  REGISTRATION_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  STUDENT_YEAR_LABELS
} from "@/lib/utils/labels";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminRegistrationsPage({
  searchParams
}: {
  searchParams: {
    q?: string;
    status?: string;
    type?: string;
    scheduleId?: string;
    paymentStatus?: string;
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
  if (searchParams.status) where.registrationStatus = searchParams.status as any;
  if (searchParams.type) where.applicantType = searchParams.type as any;
  if (searchParams.scheduleId) where.scheduleId = searchParams.scheduleId;
  if (searchParams.paymentStatus) {
    where.payment = { status: searchParams.paymentStatus as any };
  }

  const [registrations, total, schedules] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: { schedule: true, payment: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.registration.count({ where }),
    prisma.schedule.findMany()
  ]);

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
        <a
          href={`/api/admin/registrations/export${buildQuery({ page: undefined })}`}
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Export CSV
        </a>
      </div>

      <form className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" method="get">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search name / phone / number"
          className="col-span-2 rounded-lg border border-brand-200 px-3 py-2 text-sm lg:col-span-2"
        />
        <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-lg border border-brand-200 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {Object.entries(REGISTRATION_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select name="type" defaultValue={searchParams.type ?? ""} className="rounded-lg border border-brand-200 px-3 py-2 text-sm">
          <option value="">All types</option>
          <option value="STUDENT">Student</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
        <select name="paymentStatus" defaultValue={searchParams.paymentStatus ?? ""} className="rounded-lg border border-brand-200 px-3 py-2 text-sm">
          <option value="">All payment statuses</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
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

      {/* Desktop table */}
      <div className="mt-6 hidden overflow-x-auto rounded-xl border border-brand-100 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase text-ink-900/50">
            <tr>
              <th className="px-4 py-3">Reg. Number</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {registrations.map((r) => (
              <tr key={r.id} className="hover:bg-brand-50/40">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{r.registrationNumber}</td>
                <td className="px-4 py-3">{r.fullName}</td>
                <td className="px-4 py-3">{r.phone}</td>
                <td className="px-4 py-3">
                  {r.applicantType === "STUDENT" ? `Student${r.studentYear ? " · " + STUDENT_YEAR_LABELS[r.studentYear] : ""}` : "Employee"}
                </td>
                <td className="px-4 py-3">{r.schedule.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={r.payment ? PAYMENT_STATUS_LABELS[r.payment.status] : "—"} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge label={REGISTRATION_STATUS_LABELS[r.registrationStatus]} />
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

      {/* Mobile cards */}
      <div className="mt-6 space-y-3 md:hidden">
        {registrations.map((r) => (
          <Link
            key={r.id}
            href={`/admin/registrations/${r.id}`}
            className="block rounded-xl border border-brand-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-ink-900/50">{r.registrationNumber}</span>
              <StatusBadge label={REGISTRATION_STATUS_LABELS[r.registrationStatus]} />
            </div>
            <p className="mt-1 font-medium text-ink-900">{r.fullName}</p>
            <p className="text-sm text-ink-900/60">{r.phone} · {r.schedule.name}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-ink-900/60">
        <span>Page {page} of {totalPages} ({total} total)</span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={buildQuery({ page: String(page - 1) })} className="rounded-lg border border-brand-200 px-3 py-1.5">
              Previous
            </Link>
          )}
          {page < totalPages && (
            <Link href={buildQuery({ page: String(page + 1) })} className="rounded-lg border border-brand-200 px-3 py-1.5">
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
      {label}
    </span>
  );
}
