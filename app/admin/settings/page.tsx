import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { settingsSchema } from "@/lib/validation/admin";
import { uploadSiteImage } from "@/lib/storage/blob";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams: { error?: string; saved?: string };
}) {
  await requirePermission("settings:write");
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  async function saveSettings(formData: FormData) {
    "use server";
    await requirePermission("settings:write");

    const parsed = settingsSchema.safeParse({
      institutionNameAm: String(formData.get("institutionNameAm") ?? ""),
      institutionNameEn: String(formData.get("institutionNameEn") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      address: String(formData.get("address") ?? ""),
      location: String(formData.get("location") ?? ""),
      contactPersonName: String(formData.get("contactPersonName") ?? ""),
      contactPersonPhone: String(formData.get("contactPersonPhone") ?? ""),
      heroTitle: String(formData.get("heroTitle") ?? ""),
      heroDescription: String(formData.get("heroDescription") ?? ""),
      morningStartTime: String(formData.get("morningStartTime") ?? ""),
      morningEndTime: String(formData.get("morningEndTime") ?? ""),
      afternoonStartTime: String(formData.get("afternoonStartTime") ?? ""),
      afternoonEndTime: String(formData.get("afternoonEndTime") ?? ""),
      registrationOpen: formData.get("registrationOpen") === "on",
      maxUploadSizeMb: Number(formData.get("maxUploadSizeMb") ?? 5),
      duplicatePhoneScheduleBlock: formData.get("duplicatePhoneScheduleBlock") === "on"
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const message = `${firstIssue.path.join(".")}: ${firstIssue.message}`;
      redirect(`/admin/settings?error=${encodeURIComponent(message)}`);
    }

    await prisma.settings.upsert({
      where: { id: 1 },
      create: { id: 1, ...parsed.data },
      update: parsed.data
    });

    revalidatePath("/admin/settings");
    revalidatePath("/");
    redirect("/admin/settings?saved=1");
  }

  async function uploadLogo(formData: FormData) {
    "use server";
    await requirePermission("settings:write");
    const file = formData.get("logo");
    if (!(file instanceof File) || file.size === 0) return;
    const uploaded = await uploadSiteImage(file, "logo");
    await prisma.settings.upsert({
      where: { id: 1 },
      create: { id: 1, logoFileKey: uploaded.storageKey },
      update: { logoFileKey: uploaded.storageKey }
    });
    revalidatePath("/admin/settings");
    revalidatePath("/");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-ink-900">Settings</h1>

      {searchParams.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not save: {decodeURIComponent(searchParams.error)}
        </div>
      )}
      {searchParams.saved && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Settings saved successfully.
        </div>
      )}

              <form action={saveSettings} className="space-y-6 rounded-2xl border border-brand-100 bg-white p-6">
        <Field label="Institution Name (Amharic)" name="institutionNameAm" defaultValue={settings?.institutionNameAm} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" name="phone" defaultValue={settings?.phone} />
          <Field label="Email" name="email" type="email" defaultValue={settings?.email} />
        </div>
        <Field label="Address" name="address" defaultValue={settings?.address} />
        <Field label="Location (e.g. near a landmark)" name="location" defaultValue={settings?.location} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact Person Name" name="contactPersonName" defaultValue={settings?.contactPersonName} />
          <Field label="Contact Person Phone" name="contactPersonPhone" defaultValue={settings?.contactPersonPhone} />
        </div>

        <Field label="Hero Title" name="heroTitle" defaultValue={settings?.heroTitle} />
        <div>
          <label className="block text-sm font-medium">Hero Description</label>
          <textarea
            name="heroDescription"
            defaultValue={settings?.heroDescription}
            rows={3}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Morning Start" name="morningStartTime" defaultValue={settings?.morningStartTime} placeholder="08:00" />
          <Field label="Morning End" name="morningEndTime" defaultValue={settings?.morningEndTime} placeholder="09:30" />
          <Field label="Afternoon Start" name="afternoonStartTime" defaultValue={settings?.afternoonStartTime} placeholder="12:00" />
          <Field label="Afternoon End" name="afternoonEndTime" defaultValue={settings?.afternoonEndTime} placeholder="13:30" />
        </div>

        <Field label="Max Upload Size (MB)" name="maxUploadSizeMb" type="number" defaultValue={String(settings?.maxUploadSizeMb ?? 5)} />

        <div className="flex items-center gap-2">
          <input id="registrationOpen" name="registrationOpen" type="checkbox" defaultChecked={settings?.registrationOpen ?? true} />
          <label htmlFor="registrationOpen" className="text-sm">Registration Open</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="duplicatePhoneScheduleBlock"
            name="duplicatePhoneScheduleBlock"
            type="checkbox"
            defaultChecked={settings?.duplicatePhoneScheduleBlock ?? true}
          />
          <label htmlFor="duplicatePhoneScheduleBlock" className="text-sm">
            Block duplicate phone + schedule registrations
          </label>
        </div>

        <button className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          Save Settings
        </button>
      </form>

      <form action={uploadLogo} className="rounded-2xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold text-ink-900">Institution Logo</h2>
        <input name="logo" type="file" accept="image/*" className="mt-3 text-sm" />
        <button className="mt-4 rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-white">
          Upload Logo
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
      />
    </div>
  );
}