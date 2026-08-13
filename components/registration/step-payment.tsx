"use client";

import { useState } from "react";
import { formatCurrencyETB } from "@/lib/utils/labels";
import { WizardState } from "./types";

export function StepPayment({
  state,
  error,
  registrationFee,
  firstMonthFee,
  onUploaded
}: {
  state: WizardState;
  error?: string;
  registrationFee: number;
  firstMonthFee: number;
  onUploaded: (fileId: string, filename: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const total = registrationFee + firstMonthFee;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/receipt", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Something went wrong. Please try again.");
        setUploading(false);
        return;
      }

      onUploaded(data.fileId, data.filename);
    } catch {
      setUploadError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h2 className="amharic text-xl font-bold text-ink-900">ክፍያ</h2>
      <p className="amharic mt-1 text-sm text-ink-900/60">Payment</p>

      <div className="mt-6 rounded-xl bg-brand-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="amharic">የምዝገባ ክፍያ</span>
          <span>{formatCurrencyETB(registrationFee)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="amharic">የመጀመሪያ ወር ክፍያ</span>
          <span>{formatCurrencyETB(firstMonthFee)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-brand-200 pt-2 text-base font-semibold text-brand-700">
          <span className="amharic">ጠቅላላ</span>
          <span>{formatCurrencyETB(total)}</span>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="receipt" className="amharic block text-sm font-medium text-ink-900">
          የክፍያ ደረሰኝ ያስገቡ
        </label>
        <label
          htmlFor="receipt"
          className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-200 px-4 py-8 text-center transition hover:border-brand-400"
        >
          {uploading ? (
            <span className="amharic text-sm text-brand-600">በመላክ ላይ...</span>
          ) : state.receiptFilename ? (
            <span className="text-sm font-medium text-brand-700">✓ {state.receiptFilename}</span>
          ) : (
            <>
              <span className="amharic text-sm text-ink-900/70">ፋይል ለመምረጥ ይንኩ</span>
              <span className="mt-1 text-xs text-ink-900/40">JPG, PNG, PDF</span>
            </>
          )}
          <input
            id="receipt"
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
        {(uploadError || error) && (
          <p className="mt-2 text-sm text-red-600">{uploadError ?? error}</p>
        )}
      </div>
    </div>
  );
}
