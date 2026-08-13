"use client";

export function ConfirmationActions() {
  return (
    <div className="mt-6 flex justify-center gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="amharic rounded-full border border-brand-300 px-6 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
      >
        ማተም
      </button>
    </div>
  );
}
