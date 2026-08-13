import Link from "next/link";
import { prisma } from "@/lib/db";
import { getScheduleAvailability } from "@/lib/services/registration";
import { formatDays, SESSION_LABELS } from "@/lib/utils/labels";
import { HeroEntrance } from "@/components/layout/hero-entrance";

export const revalidate = 30;

export default async function HomePage() {
  const [settings, schedules, stats] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    getScheduleAvailability(),
    prisma.registration.count()
  ]);

  const approvedCount = await prisma.registration.count({ where: { registrationStatus: "APPROVED" } });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="container-page grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2">
          <HeroEntrance>
            <p className="amharic mb-3 inline-block rounded-full bg-brand-100 px-4 py-1 text-sm font-medium text-brand-700">
              ኦንላይን ምዝገባ ክፍት ነው
            </p>
            <h1 className="amharic text-3xl font-bold leading-tight text-ink-900 sm:text-5xl">
              {settings?.heroTitle ?? "ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ"}
            </h1>
            <p className="amharic mt-4 max-w-xl text-lg text-ink-900/70">
              {settings?.heroDescription ??
                "ኦንላይን በመመዝገብ የስልጠና መርሃ ግብራችንን ይቀላቀሉ። ቀላል፣ ፈጣንና ደህንነቱ የተጠበቀ ምዝገባ።"}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="amharic rounded-full bg-brand-500 px-7 py-3 text-base font-semibold text-white shadow-md transition hover:bg-brand-600 active:scale-95"
              >
                ለመመዝገብ
              </Link>
              <Link
                href="/training"
                className="amharic rounded-full border border-brand-300 px-7 py-3 text-base font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                የስልጠና መርሃ ግብር ይመልከቱ
              </Link>
            </div>
          </HeroEntrance>

          <div className="relative mx-auto aspect-square w-full max-w-md rounded-3xl bg-gradient-to-br from-brand-200 via-brand-100 to-white shadow-inner">
            <div className="absolute inset-6 rounded-2xl border border-brand-200/60 bg-white/40 backdrop-blur-sm" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-brand-100 bg-white py-10">
        <div className="container-page grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { label: "ጠቅላላ ምዝገባዎች", value: stats },
            { label: "የተመዘገቡ ተማሪዎች", value: approvedCount },
            { label: "የስልጠና መርሃ ግብሮች", value: schedules.length },
            { label: "ክፍት ቦታዎች", value: schedules.reduce((a, s) => a + s.remaining, 0) }
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-3xl font-bold text-brand-600">{item.value}</p>
              <p className="amharic mt-1 text-sm text-ink-900/60">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Intro */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="amharic text-2xl font-bold text-ink-900 sm:text-3xl">ስለ ማሰልጠኛው</h2>
          <p className="amharic mt-4 text-ink-900/70 leading-8">
            ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ ተማሪዎችንና ሠራተኞችን መንፈሳዊ ትምህርትና የመሳርያ ክህሎት በደንብ የተደራጀ የስልጠና
            መርሃ ግብር ያቀርባል። ምዝገባ ኦንላይን ሲሆን ደረሰኝ በመላክ በቀላሉ ሊጠናቀቅ ይችላል።
          </p>
        </div>
      </section>

      {/* Schedules preview */}
      <section className="bg-brand-50/50 py-16">
        <div className="container-page">
          <h2 className="amharic text-center text-2xl font-bold text-ink-900 sm:text-3xl">
            የስልጠና መርሃ ግብሮች
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <p className="font-semibold text-brand-700">{s.name}</p>
                <p className="amharic mt-1 text-sm text-ink-900/70">{formatDays(s.days)}</p>
                <p className="amharic text-sm text-ink-900/70">{SESSION_LABELS[s.session]}</p>
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.min(100, (s.registered / s.capacity) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-ink-900/60">
                    {s.registered} / {s.capacity} ቦታ
                  </p>
                  <p className={`amharic text-xs font-medium ${s.isFull ? "text-red-600" : "text-brand-600"}`}>
                    {s.isFull ? "ሙሉ ነው" : `${s.remaining} ቦታ ቀርቷል`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/register"
              className="amharic inline-block rounded-full bg-brand-500 px-7 py-3 text-base font-semibold text-white shadow-md transition hover:bg-brand-600"
            >
              አሁን ይመዝገቡ
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="amharic text-2xl font-bold text-ink-900 sm:text-3xl">ያግኙን</h2>
          <p className="amharic mt-3 text-ink-900/70">{settings?.address}</p>
          <p className="mt-1 text-ink-900/70">{settings?.phone} · {settings?.email}</p>
        </div>
      </section>
    </div>
  );
}
