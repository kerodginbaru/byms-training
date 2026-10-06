import {
  KRAR_PACKAGE_PRICES,
  PACKAGE_DESCRIPTIONS,
  PACKAGE_LABELS,
  PACKAGE_PRICES,
  PACKAGE_INTERNATIONAL_PRICES,
  REGISTRATION_PACKAGE_OPTIONS,
  WizardState
} from "./types";
import { formatCurrencyETB, formatCurrencyUSD } from "@/lib/utils/labels";

export function StepPackage({
  state,
  error,
  onChange
}: {
  state: WizardState;
  error?: string;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  const isKrar = state.department === "ክራር";

  return (
    <div>
      <h2 className="amharic text-xl font-bold text-ink-900">ጥቅል ይምረጡ</h2>
      <p className="amharic mt-1 text-sm text-ink-900/60">Choose a training package</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {REGISTRATION_PACKAGE_OPTIONS.map((pkg) => {
          const selected = state.packageType === pkg;
          const price = isKrar ? KRAR_PACKAGE_PRICES[pkg] : PACKAGE_PRICES[pkg];
          return (
            <button
              key={pkg}
              type="button"
              onClick={() =>
                onChange({
                  packageType: pkg,
                  onlineLocation: pkg === "ONLINE_CLASS" && isKrar ? state.onlineLocation : ""
                })
              }
              className={`rounded-xl border-2 p-4 text-left transition ${
                selected ? "border-brand-500 bg-brand-50" : "border-brand-100 hover:border-brand-300"
              }`}
            >
              <p className="amharic font-semibold text-brand-700">{PACKAGE_LABELS[pkg]}</p>
              <p className="amharic mt-1 text-sm text-ink-900/60">{PACKAGE_DESCRIPTIONS[pkg]}</p>
              {pkg === "ONLINE_CLASS" && (
                <>
                  <p className="amharic mt-2 text-sm font-medium text-ink-900">
                    Ethiopia local: {formatCurrencyETB(price.student)}
                  </p>
                  <p className="amharic text-sm font-medium text-ink-900">
                    Outside Ethiopia: {formatCurrencyUSD(PACKAGE_INTERNATIONAL_PRICES.ONLINE_CLASS)}
                  </p>
                </>
              )}
              {pkg !== "ONLINE_CLASS" && price && (
                <p className="amharic mt-2 text-sm font-medium text-ink-900">
                  ተማሪ፡ {formatCurrencyETB(price.student)} · ሠራተኛ፡ {formatCurrencyETB(price.employee)}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {isKrar && state.packageType === "ONLINE_CLASS" && (
        <fieldset className="mt-5">
          <legend className="amharic text-sm font-medium text-ink-900">የሚኖሩበትን አካባቢ ይምረጡ</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {([
              ["LOCAL", `ኢትዮጵያ ውስጥ · ${formatCurrencyETB(KRAR_PACKAGE_PRICES.ONLINE_CLASS.student)}`],
              ["INTERNATIONAL", `ከኢትዮጵያ ውጭ · ${formatCurrencyUSD(PACKAGE_INTERNATIONAL_PRICES.ONLINE_CLASS)}`]
            ] as const).map(([location, label]) => (
              <button
                key={location}
                type="button"
                aria-pressed={state.onlineLocation === location}
                onClick={() => onChange({ onlineLocation: location })}
                className={`amharic rounded-xl border-2 px-3 py-3 text-sm transition ${
                  state.onlineLocation === location
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-brand-100 text-ink-900/70 hover:border-brand-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}