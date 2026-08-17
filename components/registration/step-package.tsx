import { PACKAGE_DESCRIPTIONS, PACKAGE_LABELS, PACKAGE_PRICES, PackageType, WizardState } from "./types";
import { formatCurrencyETB } from "@/lib/utils/labels";

const PACKAGE_OPTIONS: PackageType[] = ["REGULAR", "SPECIAL", "HOME_TO_HOME", "KRAR"];

export function StepPackage({
  state,
  error,
  onChange
}: {
  state: WizardState;
  error?: string;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  return (
    <div>
      <h2 className="amharic text-xl font-bold text-ink-900">ጥቅል ይምረጡ</h2>
      <p className="amharic mt-1 text-sm text-ink-900/60">Choose a training package</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {PACKAGE_OPTIONS.map((pkg) => {
          const selected = state.packageType === pkg;
          const price = pkg === "REGULAR" ? null : PACKAGE_PRICES[pkg];
          return (
            <button
              key={pkg}
              type="button"
              onClick={() => onChange({ packageType: pkg })}
              className={`rounded-xl border-2 p-4 text-left transition ${
                selected ? "border-brand-500 bg-brand-50" : "border-brand-100 hover:border-brand-300"
              }`}
            >
              <p className="amharic font-semibold text-brand-700">{PACKAGE_LABELS[pkg]}</p>
              <p className="amharic mt-1 text-sm text-ink-900/60">{PACKAGE_DESCRIPTIONS[pkg]}</p>
              {price && (
                <p className="amharic mt-2 text-sm font-medium text-ink-900">
                  ተማሪ፡ {formatCurrencyETB(price.student)} · ሠራተኛ፡ {formatCurrencyETB(price.employee)}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}