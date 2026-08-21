import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { createAdminSchema, updateAdminEmailSchema } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";

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

  async function updateAdminEmail(formData: FormData) {
    "use server";
    await requirePermission("admins:write");
    const parsed = updateAdminEmailSchema.safeParse({
      id: String(formData.get("id") ?? ""),
      email: String(formData.get("email") ?? "").trim()
    });
    if (!parsed.success) return;

    await prisma.adminUser.update({
      where: { id: parsed.data.id },
      data: { email: parsed.data.email }
    });
    revalidatePath("/admin/users");
  }

  async function deleteAdmin(formData: FormData) {
    "use server";
    const session = await requirePermission("admins:write");
    const id = String(formData.get("id") ?? "");
    if (id === session.adminId) return;

    const admin = await prisma.adminUser.findUnique({ where: { id } });
    if (!admin) return;

    if (admin.role === "SUPER_ADMIN") {
      const superAdminCount = await prisma.adminUser.count({
        where: { role: "SUPER_ADMIN", isActive: true }
      });
      if (superAdminCount <= 1) return;
    }

    await prisma.adminUser.delete({ where: { id } });
    revalidatePath("/admin/users");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-900">Administrator Users</h1>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      {searchParams.saved && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">Administrator updated.</p>
      )}

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
                <td className="px-4 py-3">
                  <form action={updateAdminEmail} className="flex gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <input
                      name="email"
                      type="email"
                      defaultValue={a.email}
                      required
                      className="min-w-0 rounded-lg border border-brand-200 px-2 py-1 text-sm"
                    />
                    <button className="text-xs font-medium text-brand-600 hover:underline">Save</button>
                  </form>
                </td>
                <td className="px-4 py-3">{a.role}</td>
                <td className="px-4 py-3">{a.isActive ? "Active" : "Deactivated"}</td>
                <td className="px-4 py-3 space-x-3">
                  <form action={toggleActive} className="inline">
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs font-medium text-brand-600 hover:underline">
                      {a.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                  <form action={deleteAdmin} className="inline">
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs font-medium text-red-600 hover:underline">Delete</button>
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
