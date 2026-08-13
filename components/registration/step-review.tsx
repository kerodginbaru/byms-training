import { STUDENT_YEAR_LABELS, formatDays, SESSION_LABELS, formatCurrencyETB } from "@/lib/utils/labels";
import { ScheduleOption, WizardState } from "./types";

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
  registrationFee,
  firstMonthFee
}: {
  state: WizardState;
  schedule?: ScheduleOption;
  departmentRequired: boolean;
  registrationFee: number;
  firstMonthFee: number;
}) {
  const total = registrationFee + firstMonthFee;

  return (
    <div>
      <h2 className="amharic text-xl font-bold text-ink-900">የመመዝገቢያ ማጠቃለያ</h2>
      <p className="amharic mt-1 text-sm text-ink-900/60">Review before you submit</p>

      <div className="mt-6 rounded-xl border border-brand-100 p-4">
        <Row label="ሙሉ ስም" value={state.fullName} />
        <Row label="ስልክ ቁጥር" value={state.phone} />
        <Row label="ዓይነት" value={state.applicantType === "STUDENT" ? "ተማሪ" : "ሠራተኛ"} />
        {state.applicantType === "STUDENT" && state.studentYear && (
          <Row label="ዓመት" value={STUDENT_YEAR_LABELS[state.studentYear]} />
        )}
        {departmentRequired && state.department && <Row label="ትምህርት ክፍል" value={state.department} />}
        {schedule && (
          <>
            <Row label="የስልጠና ጊዜ" value={schedule.name} />
            <Row label="ቀናት" value={formatDays(schedule.days)} />
            <Row
              label="ክፍለ ጊዜ"
              value={`${SESSION_LABELS[schedule.session]} (${schedule.startTime}–${schedule.endTime})`}
            />
          </>
        )}
        <Row label="የምዝገባ ክፍያ" value={formatCurrencyETB(registrationFee)} />
        <Row label="የመጀመሪያ ወር ክፍያ" value={formatCurrencyETB(firstMonthFee)} />
        <Row label="ጠቅላላ" value={formatCurrencyETB(total)} />
        <Row label="ደረሰኝ" value={state.receiptFilename || "—"} />
      </div>

      <p className="amharic mt-4 text-xs text-ink-900/50">
        "ምዝገባን ያስገቡ" የሚለውን ሲጫኑ መረጃዎ ወደ ማሰልጠኛው ይላካል እና ደረሰኝዎ በአስተዳዳሪ ይረጋገጣል።
      </p>
    </div>
  );
}
