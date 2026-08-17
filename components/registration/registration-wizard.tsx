"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  INITIAL_WIZARD_STATE,
  ScheduleOption,
  WizardState,
  YEARS_REQUIRING_DEPARTMENT
} from "./types";
import { StepPersonal } from "./step-personal";
import { StepPackage } from "./step-package";
import { StepApplicantInfo } from "./step-applicant-info";
import { StepSchedule } from "./step-schedule";
import { StepPreferredTime } from "./step-preferred-time";
import { StepDocument } from "./step-payment";
import { StepReview } from "./step-review";
import { ProgressBar } from "./progress-bar";

const STEP_LABELS = ["የግል መረጃ", "ጥቅል", "ተማሪ/ሠራተኛ", "ጊዜ", "ሰነድ", "ማረጋገጫ"];
const TOTAL_STEPS = STEP_LABELS.length;

const STORAGE_KEY = "byms_registration_draft";

export function RegistrationWizard({
  schedules,
  registrationOpen
}: {
  schedules: ScheduleOption[];
  registrationOpen: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setState(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const update = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const departmentRequired = useMemo(
    () =>
      state.applicantType === "STUDENT" &&
      YEARS_REQUIRING_DEPARTMENT.has(state.studentYear as any),
    [state.applicantType, state.studentYear]
  );

  const isRegular = state.packageType === "REGULAR";

  function validateStep(current: number): boolean {
    const newErrors: Record<string, string> = {};

    if (current === 1) {
      if (state.fullName.trim().length < 3) newErrors.fullName = "እባክዎ ሙሉ ስም ያስገቡ / Please enter your full name.";
      if (!/^(\+?251|0)?(9\d{8}|7\d{8})$/.test(state.phone.replace(/[\s-]/g, ""))) {
        newErrors.phone = "ትክክለኛ የስልክ ቁጥር ያስገቡ / Please enter a valid Ethiopian phone number.";
      }
    }

    if (current === 2) {
      if (!state.packageType) newErrors.packageType = "እባክዎ ጥቅል ይምረጡ / Please select a package.";
    }

    if (current === 3) {
      if (!state.applicantType) newErrors.applicantType = "እባክዎ ይምረጡ / Please select applicant type.";
      if (state.applicantType === "STUDENT") {
        if (!state.studentYear) newErrors.studentYear = "እባክዎ ዓመት ይምረጡ / Please select your year.";
        if (departmentRequired && !state.department.trim()) {
          newErrors.department = "እባክዎ የሚማሩት መሳርያ ይምረጡ / Please select your department.";
        }
      }
    }

    if (current === 4) {
      if (isRegular) {
        if (!state.scheduleId) newErrors.scheduleId = "እባክዎ የስልጠና ጊዜ ይምረጡ / Please select your training schedule.";
      } else {
        if (!state.preferredTime.trim()) {
          newErrors.preferredTime = "እባክዎ የሚፈልጉትን ጊዜ ይግለጹ / Please tell us your preferred time.";
        }
      }
    }

    if (current === 5) {
      if (!state.receiptFileId) newErrors.receiptFileId = "እባክዎ ሰነድ ያስገቡ / Please upload a document.";
    }

    if (current === 6) {
      if (!state.agreedToRegulations) {
        newErrors.agreedToRegulations = "እባክዎ ህገ ደንቦቹን ተስማምተው ይቀጥሉ / Please accept the regulations to continue.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    if (!validateStep(6)) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        fullName: state.fullName.trim(),
        phone: state.phone.trim(),
        packageType: state.packageType,
        applicantType: state.applicantType,
        studentYear: state.applicantType === "STUDENT" ? state.studentYear || null : null,
        department: departmentRequired ? state.department.trim() : null,
        scheduleId: isRegular ? state.scheduleId : null,
        preferredTime: isRegular ? null : state.preferredTime.trim(),
        receiptFileId: state.receiptFileId,
        agreedToRegulations: state.agreedToRegulations
      };

      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }

      router.push(`/registration/${data.id}?new=1`);
    } catch (err) {
      setSubmitError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (!registrationOpen) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="amharic text-lg font-semibold text-amber-800">ምዝገባ በአሁኑ ጊዜ ዝግ ነው።</p>
        <p className="mt-1 text-sm text-amber-700">Registration is currently closed.</p>
      </div>
    );
  }

  const selectedSchedule = schedules.find((s) => s.id === state.scheduleId);

  return (
    <div className="mx-auto max-w-2xl">
      <ProgressBar labels={STEP_LABELS} currentStep={step} />

      <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && <StepPersonal state={state} errors={errors} onChange={update} />}
            {step === 2 && <StepPackage state={state} error={errors.packageType} onChange={update} />}
            {step === 3 && (
              <StepApplicantInfo
                state={state}
                errors={errors}
                onChange={update}
                departmentRequired={departmentRequired}
              />
            )}
            {step === 4 &&
              (isRegular ? (
                <StepSchedule
                  schedules={schedules}
                  selectedId={state.scheduleId}
                  error={errors.scheduleId}
                  onSelect={(id) => update({ scheduleId: id })}
                />
              ) : (
                <StepPreferredTime state={state} error={errors.preferredTime} onChange={update} />
              ))}
            {step === 5 && (
              <StepDocument
                state={state}
                error={errors.receiptFileId}
                onUploaded={(fileId, filename) => update({ receiptFileId: fileId, receiptFilename: filename })}
              />
            )}
            {step === 6 && (
              <StepReview
                state={state}
                schedule={selectedSchedule}
                departmentRequired={departmentRequired}
                agreeError={errors.agreedToRegulations}
                onAgreeChange={(agreed) => update({ agreedToRegulations: agreed })}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {submitError && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1 || submitting}
            className="amharic rounded-full border border-brand-200 px-5 py-2.5 text-sm font-medium text-brand-700 transition disabled:opacity-40"
          >
            ተመለስ
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              className="amharic rounded-full bg-brand-500 px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-95"
            >
              ቀጣይ
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="amharic rounded-full bg-brand-500 px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-95 disabled:opacity-60"
            >
              {submitting ? "በማስገባት ላይ..." : "ምዝገባን ያስገቡ"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}