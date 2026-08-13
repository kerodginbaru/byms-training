import { formatDays, SESSION_LABELS } from "@/lib/utils/labels";
import { ScheduleOption } from "./types";

export function StepSchedule({
  schedules,
  selectedId,
  error,
  onSelect
}: {
  schedules: ScheduleOption[];
  selectedId: string;
  error?: string;
  onSelect: (id: string) => void;
}) {
  const available = schedules.filter((s) => !s.isFull);

  return (
    <div>
      <h2 className="amharic text-xl font-bold text-ink-900">የስልጠና ጊዜ ይምረጡ</h2>
      <p className="amharic mt-1 text-sm text-ink-900/60">Select your training schedule</p>

      {available.length === 0 && (
        <p className="amharic mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          በአሁኑ ጊዜ ሁሉም የስልጠና ጊዜያት ሙሉ ናቸው። እባክዎ ቆይተው ይሞክሩ።
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {available.map((s) => {
          const selected = selectedId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                selected ? "border-brand-500 bg-brand-50" : "border-brand-100 hover:border-brand-300"
              }`}
            >
              <p className="font-semibold text-brand-700">{s.name}</p>
              <p className="amharic mt-1 text-sm text-ink-900/70">{formatDays(s.days)}</p>
              <p className="amharic text-sm text-ink-900/70">
                {SESSION_LABELS[s.session]} · {s.startTime}–{s.endTime}
              </p>
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.min(100, (s.registered / s.capacity) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-900/60">
                  {s.registered} / {s.capacity} — {s.remaining} ቦታ ቀርቷል
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
