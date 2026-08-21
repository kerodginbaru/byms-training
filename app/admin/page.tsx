import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requirePermission, requireSession } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { createAdminSchema } from "@/lib/validation/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password."),
  newPassword: z.string().min(10, "New password must be at least 10 characters."),
  confirmPassword: z.string().min(1, "Please confirm your new password.")
});

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: { error?: string; saved?: string };
}) {
  await requirePermission("admins:write");
  const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  async function createAdmin(formData: FormData) {
    "use server";
    await requirePermission("admins:write");

    const parsed = createAdminSchema.safeParse({
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "REGISTRATION_ADMIN")
    });
    if (!parsed.success) return;

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.adminUser.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash
      }
    });
    revalidatePath("/admin/users");
  }

  async function toggleActive(formData: FormData) {
    "use server";
    await requirePermission("admins:write");
    const id = String(formData.get("id"));
    const admin = await prisma.adminUser.findUnique({ where: { id } });
    if (!admin) return;
    await prisma.adminUser.update({ where: { id }, data: { isActive: !admin.isActive } });
    revalidatePath("/admin/users");
  }

  async function changePassword(formData: FormData) {
    "use server";
    const session = await requireSession();

    const parsed = changePasswordSchema.safeParse({
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? "")
    });

    if (!parsed.success) {
      redirect(`/admin/users?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
    }

    if (parsed.data.newPassword !== parsed.data.confirmPassword) {
      redirect(`/admin/users?error=${encodeURIComponent("New passwords do not match.")}`);
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: session.adminId } });
    if (!admin) {
      redirect(`/admin/users?error=${encodeURIComponent("Account not found.")}`);
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
    if (!valid) {
      redirect(`/admin/users?error=${encodeURIComponent("Current password is incorrect.")}`);
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.adminUser.update({
      where: { id: session.adminId },
      data: { passwordHash: newHash }
    });

    redirect("/admin/users?saved=1");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-ink-900">Administrator Users</h1>

      {searchParams.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}
      {searchParams.saved && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Password changed successfully.
        </div>
      )}

      <section className="rounded-2xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold text-ink-900">Change My Password</h2>
        <form action={changePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Current Password</label>
            <input name="currentPassword" type="password" required className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">New Password</label>
            <input name="newPassword" type="password" required minLength={10} className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Confirm New Password</label>
            <input name="confirmPassword" type="password" required minLength={10} className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <button className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Change Password
            </button>
          </div>
        </form>
      </section>

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase text-ink-900/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {admins.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">{a.fullName}</td>
                <td className="px-4 py-3">{a.email}</td>
                <td className="px-4 py-3">{a.role}</td>
                <td className="px-4 py-3">{a.isActive ? "Active" : "Deactivated"}</td>
                <td className="px-4 py-3">
                  <form action={toggleActive}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs font-medium text-brand-600 hover:underline">
                      {a.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 rounded-2xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold text-ink-900">Add Administrator</h2>
        <form action={createAdmin} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input name="fullName" required className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Temporary Password</label>
            <input name="password" type="password" required minLength={10} className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Role</label>
            <select name="role" className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm">
              <option value="REGISTRATION_ADMIN">Registration Admin</option>
              <option value="VIEWER">Viewer</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Create Administrator
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}