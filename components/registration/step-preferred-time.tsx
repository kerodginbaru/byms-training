import { WizardState } from "./types";

export function StepPreferredTime({
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
      <h2 className="amharic text-xl font-bold text-ink-900">የሚመርጡት ጊዜ</h2>
      <p className="amharic mt-1 text-sm text-ink-900/60">
        ይህ ጥቅል በተለየ ሁኔታ የሚሰጥ ስለሆነ፣ የሚፈልጉትን ቀንና ሰዓት ይግለጹ። ማሰልጠኛው ደውሎ ያረጋግጣል።
      </p>

      <div className="mt-6">
        <label htmlFor="preferredTime" className="amharic block text-sm font-medium text-ink-900">
          የሚፈልጉት ቀንና ሰዓት
        </label>
        <textarea
          id="preferredTime"
          value={state.preferredTime}
          onChange={(e) => onChange({ preferredTime: e.target.value })}
          rows={3}
          placeholder="ለምሳሌ፡ ቅዳሜ ከሰዓት በኋላ"
          className="mt-1.5 w-full rounded-xl border border-brand-200 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}