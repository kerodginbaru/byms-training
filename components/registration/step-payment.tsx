"use client";

import { useState } from "react";
import { formatCurrencyETB } from "@/lib/utils/labels";
import { PACKAGE_PRICES, WizardState } from "./types";

export function StepDocument({
  state,
  error,
  onUploaded
}: {
  state: WizardState;
  error?: string;
  onUploaded: (fileId: string, filename: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const price = state.packageType ? PACKAGE_PRICES[state.packageType] : null;
  const amountDue = price ? (state.applicantType === "EMPLOYEE" ? price.employee : price.student) : null;

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
      <h2 className="amharic text-xl font-bold text-ink-900">የክፍያ ማረጋገጫ ያስገቡ</h2>
      <p className="amharic mt-1 text-sm text-ink-900/60">Upload proof of payment</p>

      {amountDue !== null && (
        <div className="mt-4 rounded-xl bg-brand-50 p-4">
          <div className="flex justify-between text-sm">
            <span className="amharic">የመጀመሪያ ወር ክፍያ ({state.applicantType === "EMPLOYEE" ? "ሠራተኛ" : "ተማሪ"})</span>
            <span className="font-semibold text-brand-700">{formatCurrencyETB(amountDue)}</span>
          </div>
        </div>
      )}

      <p className="amharic mt-4 text-sm text-ink-900/70 leading-6">
        የመጀመሪያ ወር ክፍያዎን ከከፈሉ በኋላ፣ የክፍያ ደረሰኝ ስክሪንሾት ወይም PDF ከ5 ሜባ ያልበለጠ ያስገቡ።
      </p>

      <div className="mt-4">
        <label htmlFor="document" className="amharic block text-sm font-medium text-ink-900">
          ፋይል ይምረጡ
        </label>
        <label
          htmlFor="document"
          className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-200 px-4 py-8 text-center transition hover:border-brand-400"
        >
          {uploading ? (
            <span className="amharic text-sm text-brand-600">በመላክ ላይ...</span>
          ) : state.receiptFilename ? (
            <span className="text-sm font-medium text-brand-700">✓ {state.receiptFilename}</span>
          ) : (
            <>
              <span className="amharic text-sm text-ink-900/70">ስክሪንሾት ወይም PDF ለመምረጥ ይንኩ</span>
              <span className="mt-1 text-xs text-ink-900/40">JPG, PNG, PDF · ከ5 ሜባ ያልበለጠ</span>
            </>
          )}
          <input
            id="document"
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