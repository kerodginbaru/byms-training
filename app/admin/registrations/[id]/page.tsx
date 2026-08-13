import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import {
  approveRegistration,
  rejectRegistration,
  verifyPayment,
  rejectPayment
} from "@/lib/services/admin-actions";
import {
  STUDENT_YEAR_LABELS,
  formatDays,
  SESSION_LABELS,
  REGISTRATION_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatCurrencyETB
} from "@/lib/utils/labels";

export const dynamic = "force-dynamic";

export default async function RegistrationDetailPage({ params }: { params: { id: string } }) {
  const session = await requirePermission("registrations:read");

  const registration = await prisma.registration.findUnique({
    where: { id: params.id },
    include: { schedule: true, payment: { include: { receiptFile: true } }, uploadedFiles: true }
  });

  if (!registration) notFound();

  const canWrite = session.role === "SUPER_ADMIN" || session.role === "REGISTRATION_ADMIN";

  async function approveAction() {
    "use server";
    const s = await requirePermission("registrations:write");
    await approveRegistration(params.id, s.adminId);
    revalidatePath(`/admin/registrations/${params.id}`);
  }

  async function rejectAction(formData: FormData) {
    "use server";
    const s = await requirePermission("registrations:write");
    await rejectRegistration(params.id, s.adminId, String(formData.get("reason") ?? ""));
    revalidatePath(`/admin/registrations/${params.id}`);
  }

  async function verifyPaymentAction() {
    "use server";
    const s = await requirePermission("payments:write");
    await verifyPayment(params.id, s.adminId);
    revalidatePath(`/admin/registrations/${params.id}`);
  }

  async function rejectPaymentAction(formData: FormData) {
    "use server";
    const s = await requirePermission("payments:write");
    await rejectPayment(params.id, s.adminId, String(formData.get("reason") ?? "Not specified"));
    revalidatePath(`/admin/registrations/${params.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-bold text-ink-900">{registration.registrationNumber}</h1>
          <p className="text-sm text-ink-900/60">
            Created {new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short" }).format(registration.createdAt)}
          </p>
        </div>
        <Badge label={REGISTRATION_STATUS_LABELS[registration.registrationStatus]} />
      </div>

      <section className="mt-6 rounded-2xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold text-ink-900">Personal Information</h2>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-ink-900/50">Full Name</dt><dd>{registration.fullName}</dd>
          <dt className="text-ink-900/50">Phone</dt><dd>{registration.phone}</dd>
          <dt className="text-ink-900/50">Applicant Type</dt><dd>{registration.applicantType}</dd>
          {registration.studentYear && (
            <>
              <dt className="text-ink-900/50">Year</dt>
              <dd>{STUDENT_YEAR_LABELS[registration.studentYear]}</dd>
            </>
          )}
          {registration.department && (
            <>
              <dt className="text-ink-900/50">Department</dt>
              <dd>{registration.department}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="mt-4 rounded-2xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold text-ink-900">Schedule</h2>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-ink-900/50">Schedule</dt><dd>{registration.schedule.name}</dd>
          <dt className="text-ink-900/50">Days</dt><dd>{formatDays(registration.schedule.days)}</dd>
          <dt className="text-ink-900/50">Session</dt>
          <dd>
            {SESSION_LABELS[registration.schedule.session]} ({registration.schedule.startTime}–
            {registration.schedule.endTime})
          </dd>
        </dl>
      </section>

      <section className="mt-4 rounded-2xl border border-brand-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">Payment</h2>
          {registration.payment && <Badge label={PAYMENT_STATUS_LABELS[registration.payment.status]} />}
        </div>
        {registration.payment ? (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-ink-900/50">Registration Fee</dt>
              <dd>{formatCurrencyETB(Number(registration.payment.registrationFee))}</dd>
              <dt className="text-ink-900/50">First Month</dt>
              <dd>{formatCurrencyETB(Number(registration.payment.firstMonthFee))}</dd>
              <dt className="text-ink-900/50">Total</dt>
              <dd className="font-semibold">{formatCurrencyETB(Number(registration.payment.totalAmount))}</dd>
            </dl>

            {registration.payment.receiptFileId && (
              <a
                href={`/api/admin/receipts/${registration.payment.receiptFileId}`}
                className="mt-4 inline-block rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                View / Download Receipt
              </a>
            )}

            {canWrite && registration.payment.status === "PENDING_VERIFICATION" && (
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-brand-50 pt-4">
                <form action={verifyPaymentAction}>
                  <button className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                    Verify Payment
                  </button>
                </form>
                <form action={rejectPaymentAction} className="flex items-center gap-2">
                  <input
                    name="reason"
                    placeholder="Rejection reason"
                    required
                    className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
                  />
                  <button className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                    Reject Payment
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-900/50">No payment record.</p>
        )}
      </section>

      {canWrite && registration.registrationStatus === "PENDING" && (
        <section className="mt-4 rounded-2xl border border-brand-100 bg-white p-6">
          <h2 className="font-semibold text-ink-900">Registration Decision</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <form action={approveAction}>
              <button className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
                Approve Registration
              </button>
            </form>
            <form action={rejectAction} className="flex items-center gap-2">
              <input
                name="reason"
                placeholder="Rejection reason (optional)"
                className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
              <button className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                Reject Registration
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
      {label}
    </span>
  );
}
