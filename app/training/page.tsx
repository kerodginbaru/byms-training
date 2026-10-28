import type { Metadata } from "next";
import Link from "next/link";
import { getScheduleAvailability } from "@/lib/services/registration";
import { formatDays, SESSION_LABELS, formatCurrencyETB } from "@/lib/utils/labels";
import {
  KRAR_PACKAGE_PRICES,
  PACKAGE_DESCRIPTIONS,
  PACKAGE_INTERNATIONAL_PRICES,
  PACKAGE_LABELS,
  PACKAGE_PRICES,
  REGISTRATION_PACKAGE_OPTIONS,
  TRAININGS_OFFERED
} from "@/components/registration/types";
import { formatCurrencyUSD } from "@/lib/utils/labels";

export const metadata: Metadata = { title: "የስልጠና መርሃ ግብር" };
export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const schedules = await getScheduleAvailability();

  return (
    <div className="container-page py-16">
      <h1 className="amharic text-3xl font-bold text-ink-900">የስልጠና መርሃ ግብር</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {TRAININGS_OFFERED.map((t) => (
          <span key={t} className="amharic rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700">
            {t}
          </span>
        ))}
      </div>

      {/* Packages */}
      <h2 className="amharic mt-10 text-xl font-bold text-ink-900">ጥቅሎች</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REGISTRATION_PACKAGE_OPTIONS.map((key) => (
          <div key={key} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <p className="amharic font-semibold text-brand-700">{PACKAGE_LABELS[key]}</p>
            <p className="amharic mt-1 text-sm text-ink-900/60">{PACKAGE_DESCRIPTIONS[key]}</p>
            {key === "ONLINE_CLASS" ? (
              <>
                <p className="amharic mt-3 text-sm font-medium text-ink-900">
                ETB option: {formatCurrencyETB(PACKAGE_PRICES[key].student)}
                </p>
                <p className="amharic text-sm font-medium text-ink-900">
                USD option: {formatCurrencyUSD(PACKAGE_INTERNATIONAL_PRICES.ONLINE_CLASS)}
                </p>
              </>
            ) : (
              <>
                <p className="amharic mt-3 text-sm font-medium text-ink-900">
                  ተማሪ፡ {formatCurrencyETB(PACKAGE_PRICES[key].student)}
                </p>
                <p className="amharic text-sm font-medium text-ink-900">
                  ሠራተኛ፡ {formatCurrencyETB(PACKAGE_PRICES[key].employee)}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      <h2 className="amharic mt-10 text-xl font-bold text-ink-900">የክራር ስልጠና ዋጋዎች</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REGISTRATION_PACKAGE_OPTIONS.map((key) => (
          <div key={key} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <p className="amharic font-semibold text-brand-700">{PACKAGE_LABELS[key]}</p>
            {key === "ONLINE_CLASS" ? (
              <>
                <p className="amharic mt-3 text-sm font-medium text-ink-900">
                ETB option: {formatCurrencyETB(KRAR_PACKAGE_PRICES.ONLINE_CLASS.student)}
                </p>
                <p className="amharic text-sm font-medium text-ink-900">
                USD option: {formatCurrencyUSD(PACKAGE_INTERNATIONAL_PRICES.ONLINE_CLASS)}
                </p>
              </>
            ) : (
              <>
                <p className="amharic mt-3 text-sm font-medium text-ink-900">
                  ተማሪ፡ {formatCurrencyETB(KRAR_PACKAGE_PRICES[key].student)}
                </p>
                <p className="amharic text-sm font-medium text-ink-900">
                  ሠራተኛ፡ {formatCurrencyETB(KRAR_PACKAGE_PRICES[key].employee)}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Regular schedule slots */}
      <h2 className="amharic mt-10 text-xl font-bold text-ink-900">የመደበኛ ስልጠና መርሃ ግብር</h2>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {schedules.map((s) => (
          <div key={s.id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <p className="font-semibold text-brand-700">{s.name}</p>
            <p className="amharic mt-1 text-sm text-ink-900/70">{formatDays(s.days)}</p>
            <p className="amharic text-sm text-ink-900/70">
              {SESSION_LABELS[s.session]} · {s.startTime}–{s.endTime}
            </p>
            <div className="mt-3 space-y-1 border-t border-brand-50 pt-3">
              {TRAININGS_OFFERED.map((instrument) => {
                const registered = s.registeredByDepartment[instrument] ?? 0;
                const remaining = Math.max(0, s.capacity - registered);
                return (
                  <p key={instrument} className="amharic flex justify-between gap-2 text-xs">
                    <span className="font-medium text-ink-900">{instrument}</span>
                    <span className={remaining === 0 ? "text-red-600" : "text-brand-600"}>
                      {remaining === 0 ? "ሙሉ ነው" : `${registered}/${s.capacity} · ${remaining} ቦታ ቀርቷል`}
                    </span>
                  </p>
                );
              })}
            </div>
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