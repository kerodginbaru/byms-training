import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { scheduleSchema } from "@/lib/validation/admin";
import { formatDays, SESSION_LABELS } from "@/lib/utils/labels";

export const dynamic = "force-dynamic";

const DAY_CODES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export default async function AdminSchedulesPage() {
  await requirePermission("schedules:write");

  const schedules = await prisma.schedule.findMany({ orderBy: { name: "asc" } });
  const counts = await prisma.registration.groupBy({
    by: ["scheduleId"],
    where: { packageType: "REGULAR" },
    _count: { _all: true }
  });
  const countMap = new Map(counts.map((c) => [c.scheduleId, c._count._all]));

  async function createSchedule(formData: FormData) {
    "use server";
    await requirePermission("schedules:write");

    const days = DAY_CODES.filter((d) => formData.get(`day-${d}`) === "on");
    const parsed = scheduleSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      days,
      session: String(formData.get("session") ?? "MORNING"),
      startTime: String(formData.get("startTime") ?? ""),
      endTime: String(formData.get("endTime") ?? ""),
      capacity: Number(formData.get("capacity") ?? 30),
      isActive: formData.get("isActive") === "on"
    });
    if (!parsed.success) return;

    await prisma.schedule.create({ data: parsed.data });
    revalidatePath("/admin/schedules");
  }

  async function toggleActive(formData: FormData) {
    "use server";
    await requirePermission("schedules:write");
    const id = String(formData.get("id"));
    const schedule = await prisma.schedule.findUnique({ where: { id } });
    if (!schedule) return;
    await prisma.schedule.update({ where: { id }, data: { isActive: !schedule.isActive } });
    revalidatePath("/admin/schedules");
  }

  async function updateCapacity(formData: FormData) {
    "use server";
    await requirePermission("schedules:write");
    const id = String(formData.get("id"));
    const capacity = Number(formData.get("capacity"));
    if (!Number.isFinite(capacity) || capacity < 1) return;
    await prisma.schedule.update({ where: { id }, data: { capacity } });
    revalidatePath("/admin/schedules");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Schedules</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase text-ink-900/50">
            <tr>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Session / Time</th>
              <th className="px-4 py-3">Registered / Capacity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {schedules.map((s) => {
              const registered = countMap.get(s.id) ?? 0;
              const full = registered >= s.capacity;
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{formatDays(s.days)}</td>
                  <td className="px-4 py-3">
                    {SESSION_LABELS[s.session]} · {s.startTime}–{s.endTime}
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateCapacity} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      {registered} /{" "}
                      <input
                        name="capacity"
                        type="number"
                        min={1}
                        defaultValue={s.capacity}
                        className="w-16 rounded border border-brand-200 px-1.5 py-0.5 text-sm"
                      />
                      <button className="text-xs font-medium text-brand-600 hover:underline">Save</button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        !s.isActive
                          ? "bg-gray-100 text-gray-600"
                          : full
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {!s.isActive ? "Inactive" : full ? "FULL" : "Open"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleActive}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-xs font-medium text-brand-600 hover:underline">
                        {s.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-8 rounded-2xl border border-brand-100 bg-white p-6">
        <h2 className="font-semibold text-ink-900">Add New Schedule</h2>
        <form action={createSchedule} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input name="name" required className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Session</label>
            <select name="session" className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm">
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Start Time (HH:mm)</label>
            <input name="startTime" required placeholder="08:00" className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">End Time (HH:mm)</label>
            <input name="endTime" required placeholder="09:30" className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Capacity</label>
            <input name="capacity" type="number" defaultValue={30} min={1} className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium">Days</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {DAY_CODES.map((d) => (
                <label key={d} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name={`day-${d}`} /> {d}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <button className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Create Schedule
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
