import Link from "next/link";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { PAYMENT_STATUS_LABELS, formatCurrencyETB } from "@/lib/utils/labels";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({
  searchParams
}: {
  searchParams: { status?: string };
}) {
  await requirePermission("payments:read");

  const payments = await prisma.payment.findMany({
    where: searchParams.status ? { status: searchParams.status as any } : undefined,
    include: { registration: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Payments</h1>

      <div className="mt-4 flex gap-2 text-sm">
        {["", "PENDING_VERIFICATION", "VERIFIED", "REJECTED"].map((s) => (
          <Link
            key={s}
            href={s ? `?status=${s}` : "?"}
            className={`rounded-full px-3 py-1.5 ${
              (searchParams.status ?? "") === s ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-700"
            }`}
          >
            {s ? PAYMENT_STATUS_LABELS[s] : "All"}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase text-ink-900/50">
            <tr>
              <th className="px-4 py-3">Registration</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-mono text-xs">{p.registration.registrationNumber}</td>
                <td className="px-4 py-3">{p.registration.fullName}</td>
                <td className="px-4 py-3">{formatCurrencyETB(Number(p.totalAmount))}</td>
                <td className="px-4 py-3">{PAYMENT_STATUS_LABELS[p.status]}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/registrations/${p.registrationId}`} className="font-medium text-brand-600 hover:underline">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
