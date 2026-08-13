import type { Metadata } from "next";
import Link from "next/link";
import { getScheduleAvailability } from "@/lib/services/registration";
import { prisma } from "@/lib/db";
import { formatDays, SESSION_LABELS, formatCurrencyETB } from "@/lib/utils/labels";

export const metadata: Metadata = { title: "የስልጠና መርሃ ግብር" };
export const revalidate = 30;

export default async function TrainingPage() {
  const [schedules, settings] = await Promise.all([
    getScheduleAvailability(),
    prisma.settings.findUnique({ where: { id: 1 } })
  ]);

  return (
    <div className="container-page py-16">
      <h1 className="amharic text-3xl font-bold text-ink-900">የስልጠና መርሃ ግብር</h1>
      <p className="amharic mt-2 text-ink-900/70">
        ምዝገባ ክፍያ: {settings ? formatCurrencyETB(Number(settings.registrationFee)) : "—"} · የመጀመሪያ ወር ክፍያ:{" "}
        {settings ? formatCurrencyETB(Number(settings.firstMonthFee)) : "—"}
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {schedules.map((s) => (
          <div key={s.id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <p className="font-semibold text-brand-700">{s.name}</p>
            <p className="amharic mt-1 text-sm text-ink-900/70">{formatDays(s.days)}</p>
            <p className="amharic text-sm text-ink-900/70">
              {SESSION_LABELS[s.session]} · {s.startTime}–{s.endTime}
            </p>
            <p className="mt-3 text-xs text-ink-900/60">
              {s.registered} / {s.capacity} ቦታ
            </p>
            <p className={`amharic text-xs font-medium ${s.isFull ? "text-red-600" : "text-brand-600"}`}>
              {s.isFull ? "ሙሉ ነው" : `${s.remaining} ቦታ ቀርቷል`}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <Link
          href="/register"
          className="amharic inline-block rounded-full bg-brand-500 px-7 py-3 font-semibold text-white shadow-md hover:bg-brand-600"
        >
          አሁን ይመዝገቡ
        </Link>
      </div>
    </div>
  );
}
