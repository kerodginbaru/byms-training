import { STUDENT_YEAR_LABELS, formatDays, SESSION_LABELS, formatCurrencyETB } from "@/lib/utils/labels";
import { PACKAGE_LABELS, PACKAGE_PRICES, REGULATIONS_AM, ScheduleOption, WizardState } from "./types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-brand-50 py-2 text-sm last:border-0">
      <span className="amharic text-ink-900/60">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  );
}

export function StepReview({
  state,
  schedule,
  departmentRequired,
  agreeError,
  onAgreeChange
}: {
  state: WizardState;
  schedule?: ScheduleOption;
  departmentRequired: boolean;
  agreeError?: string;
  onAgreeChange: (agreed: boolean) => void;
}) {
  const isRegular = state.packageType === "REGULAR";
  const price =
    !isRegular && state.packageType
      ? PACKAGE_PRICES[state.packageType as Exclude<typeof state.packageType, "REGULAR" | "">]
      : null;
  const referencePrice = price ? (state.applicantType === "EMPLOYEE" ? price.employee : price.student) : null;

  return (
    <div>
      <h2 className="amharic text-xl font-bold text-ink-900">የመመዝገቢያ ማጠቃለያ</h2>
      <p className="amharic mt-1 text-sm text-ink-900/60">Review before you submit</p>

      <div className="mt-6 rounded-xl border border-brand-100 p-4">
        <Row label="ሙሉ ስም" value={state.fullName} />
        <Row label="ስልክ ቁጥር" value={state.phone} />
        <Row label="ጥቅል" value={state.packageType ? PACKAGE_LABELS[state.packageType] : "—"} />
        <Row label="ዓይነት" value={state.applicantType === "STUDENT" ? "ተማሪ" : "ሠራተኛ"} />
        {state.applicantType === "STUDENT" && state.studentYear && (
          <Row label="ዓመት" value={STUDENT_YEAR_LABELS[state.studentYear]} />
        )}
        {departmentRequired && state.department && <Row label="የሚማሩት መሳርያ" value={state.department} />}
        {isRegular && schedule && (
          <>
            <Row label="የስልጠና ጊዜ" value={schedule.name} />
            <Row label="ቀናት" value={formatDays(schedule.days)} />
            <Row
              label="ክፍለ ጊዜ"
              value={`${SESSION_LABELS[schedule.session]} (${schedule.startTime}–${schedule.endTime})`}
            />
          </>
        )}
        {!isRegular && state.preferredTime && <Row label="የሚፈልጉት ጊዜ" value={state.preferredTime} />}
        {referencePrice !== null && <Row label="ግምታዊ ክፍያ" value={formatCurrencyETB(referencePrice)} />}
        <Row label="ሰነድ" value={state.receiptFilename || "—"} />
      </div>

      <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
        <p className="amharic text-sm font-semibold text-ink-900">ህገ ደንቦች</p>
        <ol className="amharic mt-2 list-decimal space-y-1.5 pl-5 text-sm text-ink-900/70">
          {REGULATIONS_AM.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
        <label className="amharic mt-4 flex items-start gap-2.5 text-sm font-medium text-ink-900">
          <input
            type="checkbox"
            checked={state.agreedToRegulations}
            onChange={(e) => onAgreeChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-300"
          />
          <span>ከላይ የተዘረዘሩትን ህገ ደንቦች አንብቤ ተስማምቻለሁ።</span>
        </label>
        {agreeError && <p className="mt-1.5 text-sm text-red-600">{agreeError}</p>}
      </div>

      <p className="amharic mt-4 text-xs text-ink-900/50">
        "ምዝገባን ያስገቡ" የሚለውን ሲጫኑ መረጃዎ ወደ ማሰልጠኛው ይላካል።
      </p>
    </div>
  );
}