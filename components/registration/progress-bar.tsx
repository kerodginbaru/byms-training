export function ProgressBar({ labels, currentStep }: { labels: string[]; currentStep: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        {labels.map((label, idx) => {
          const stepNum = idx + 1;
          const done = stepNum < currentStep;
          const active = stepNum === currentStep;
          return (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                  done
                    ? "bg-brand-500 text-white"
                    : active
                    ? "border-2 border-brand-500 text-brand-600"
                    : "border border-brand-200 text-ink-900/40"
                }`}
              >
                {done ? "✓" : stepNum}
              </div>
              <p className="amharic mt-1 hidden text-center text-[11px] text-ink-900/60 sm:block">{label}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (labels.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
