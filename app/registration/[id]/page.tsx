import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { STUDENT_YEAR_LABELS, formatDays, SESSION_LABELS } from "@/lib/utils/labels";
import { PACKAGE_LABELS } from "@/components/registration/types";
import { ConfirmationActions } from "@/components/registration/confirmation-actions";
import { RegistrationQrCode } from "@/components/registration/qr-code";

export const metadata: Metadata = { title: "የምዝገባ ማረጋገጫ" };

export default async function ConfirmationPage({ params }: { params: { id: string } }) {
  const registration = await prisma.registration.findUnique({
    where: { id: params.id },
    include: { schedule: true }
  });

  if (!registration) notFound();

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div id="confirmation-card" className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
              ✓
            </div>
            <h1 className="amharic mt-4 text-2xl font-bold text-ink-900">ምዝገባዎ ተሳክቷል!</h1>
            <p className="amharic mt-1 text-sm text-ink-900/60">Registration Successful</p>
            <p className="mt-3 font-mono text-lg font-semibold text-brand-700">
              {registration.registrationNumber}
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <RegistrationQrCode value={registration.registrationNumber} />
          </div>

          <dl className="mt-8 divide-y divide-brand-50 text-sm">
            <Row label="ሙሉ ስም" value={registration.fullName} />
            <Row label="ስልክ ቁጥር" value={registration.phone} />
            <Row label="ጥቅል" value={PACKAGE_LABELS[registration.packageType]} />
            <Row label="ዓይነት" value={registration.applicantType === "STUDENT" ? "ተማሪ" : "ሠራተኛ"} />
            {registration.studentYear && (
              <Row label="ዓመት" value={STUDENT_YEAR_LABELS[registration.studentYear]} />
            )}
            {registration.department && <Row label="የሚማሩት መሳርያ" value={registration.department} />}
            {registration.schedule ? (
              <>
                <Row label="የስልጠና ጊዜ" value={registration.schedule.name} />
                <Row label="ቀናት" value={formatDays(registration.schedule.days)} />
                <Row
                  label="ክፍለ ጊዜ"
                  value={`${SESSION_LABELS[registration.schedule.session]} (${registration.schedule.startTime}–${registration.schedule.endTime})`}
                />
              </>
            ) : (
              registration.preferredTime && <Row label="የሚፈልጉት ጊዜ" value={registration.preferredTime} />
            )}
            <Row
              label="የተመዘገበበት ቀን"
              value={new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(registration.createdAt)}
            />
          </dl>
        </div>

        <ConfirmationActions />

        <p className="amharic mt-6 text-center text-sm text-ink-900/60">
          እባክዎ ይህንን ቁጥር ያስቀምጡ። ማሰልጠኛው በስልክ ቁጥርዎ ደውሎ ያረጋግጣል።
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5">
      <dt className="amharic text-ink-900/60">{label}</dt>
      <dd className="font-medium text-ink-900">{value}</dd>
    </div>
  );
}