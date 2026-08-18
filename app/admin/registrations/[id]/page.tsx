import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { deleteRegistration } from "@/lib/services/registration";
import { generateCertificatePdf } from "@/lib/certificate/generate";
import { uploadCertificatePdf, uploadCertificatePhoto } from "@/lib/storage/blob";
import { STUDENT_YEAR_LABELS, formatDays, SESSION_LABELS } from "@/lib/utils/labels";
import { PACKAGE_LABELS } from "@/components/registration/types";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function RegistrationDetailPage({ params }: { params: { id: string } }) {
  const session = await requirePermission("registrations:read");

  const registration = await prisma.registration.findUnique({
    where: { id: params.id },
    include: { schedule: true, uploadedFiles: true }
  });

  if (!registration) notFound();

  const canDelete = session.role === "SUPER_ADMIN" || session.role === "REGISTRATION_ADMIN";
  const document = registration.uploadedFiles.find((f) => f.kind === "DOCUMENT");
  const certificate = registration.uploadedFiles
    .filter((f) => f.kind === "CERTIFICATE")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  async function deleteAction() {
    "use server";
    const s = await requirePermission("registrations:write");
    await deleteRegistration(params.id, s.adminId);
    redirect("/admin/registrations");
  }

  async function generateCertificateAction(formData: FormData) {
    "use server";
    await requirePermission("registrations:write");

    const photo = formData.get("photo");
    if (!(photo instanceof File) || photo.size === 0) return;

    const reg = await prisma.registration.findUnique({ where: { id: params.id } });
    if (!reg) return;

    const uploadedPhoto = await uploadCertificatePhoto(photo);
    const photoBytes = new Uint8Array(await photo.arrayBuffer());

    const pdfBytes = await generateCertificatePdf({
      fullName: reg.fullName,
      photoBytes,
      photoMimeType: photo.type
    });

    const uploadedCert = await uploadCertificatePdf(pdfBytes, params.id);

    await prisma.$transaction([
      prisma.uploadedFile.create({
        data: {
          kind: "CERTIFICATE_PHOTO",
          registrationId: params.id,
          storageKey: uploadedPhoto.storageKey,
          originalFilename: uploadedPhoto.originalFilename,
          mimeType: uploadedPhoto.mimeType,
          size: uploadedPhoto.size
        }
      }),
      prisma.uploadedFile.create({
        data: {
          kind: "CERTIFICATE",
          registrationId: params.id,
          storageKey: uploadedCert.storageKey,
          originalFilename: `${reg.registrationNumber}-certificate.pdf`,
          mimeType: "application/pdf",
          size: uploadedCert.size
        }
      })
    ]);

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
        <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
          {PACKAGE_LABELS[registration.packageType]}
        </span>
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
              <dt className="text-ink-900/50">Instrument</dt>
              <dd>{registration.department}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="mt-4 rounded-2xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold text-ink-900">Schedule</h2>
        {registration.schedule ? (
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-ink-900/50">Schedule</dt><dd>{registration.schedule.name}</dd>
            <dt className="text-ink-900/50">Days</dt><dd>{formatDays(registration.schedule.days)}</dd>
            <dt className="text-ink-900/50">Session</dt>
            <dd>
              {SESSION_LABELS[registration.schedule.session]} ({registration.schedule.startTime}–
              {registration.schedule.endTime})
            </dd>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-ink-900/70">
            Preferred time (individually arranged): {registration.preferredTime ?? "—"}
          </p>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold text-ink-900">Uploaded Document</h2>
        {document ? (
          
           <a href={`/api/admin/receipts/${document.id}`}
            className="mt-3 inline-block rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            View / Download Document
          </a>
        ) : (
          <p className="mt-2 text-sm text-ink-900/50">No document uploaded.</p>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold text-ink-900">ሰርተፍኬት (Certificate)</h2>
        {certificate ? (
          <>
            <p className="mt-1 text-sm text-ink-900/60">A certificate has already been generated.</p>
            
             <a href={`/api/admin/receipts/${certificate.id}`}
              className="mt-3 inline-block rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              View / Download Certificate
            </a>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-900/60">No certificate generated yet.</p>
        )}

        {canDelete && (
          <form action={generateCertificateAction} className="mt-4 flex flex-wrap items-center gap-3 border-t border-brand-50 pt-4">
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              required
              className="text-sm"
            />
            <button className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              {certificate ? "Regenerate Certificate" : "Generate Certificate"}
            </button>
          </form>
        )}
      </section>

      {canDelete && (
        <section className="mt-4 rounded-2xl border border-red-100 bg-red-50/40 p-6">
          <h2 className="font-semibold text-ink-900">Delete Registration</h2>
          <p className="mt-1 text-sm text-ink-900/60">
            This permanently removes the registration and frees its schedule seat (if any). This cannot be undone.
          </p>
          <form action={deleteAction} className="mt-4">
            <button className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
              Delete Registration
            </button>
          </form>
        </section>
      )}
    </div>
  );
}