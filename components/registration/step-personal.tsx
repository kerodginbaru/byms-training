import { WizardState } from "./types";

export function StepPersonal({
  state,
  errors,
  onChange
}: {
  state: WizardState;
  errors: Record<string, string>;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  return (
    <div>
      <h2 className="amharic text-xl font-bold text-ink-900">የግል መረጃ</h2>
      <p className="amharic mt-1 text-sm text-ink-900/60">Personal information</p>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="fullName" className="amharic block text-sm font-medium text-ink-900">
            ሙሉ ስም
          </label>
          <input
            id="fullName"
            type="text"
            value={state.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-brand-200 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
            placeholder="ሙሉ ስም ያስገቡ"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
          />
          {errors.fullName && (
            <p id="fullName-error" className="mt-1 text-sm text-red-600">
              {errors.fullName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="amharic block text-sm font-medium text-ink-900">
            ስልክ ቁጥር
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            value={state.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-brand-200 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
            placeholder="09XXXXXXXX"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-sm text-red-600">
              {errors.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
