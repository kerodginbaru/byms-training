import { STUDENT_YEAR_LABELS } from "@/lib/utils/labels";
import { StudentYear, WizardState } from "./types";

const YEAR_OPTIONS: StudentYear[] = ["REMEDIAL", "YEAR_1", "YEAR_2", "YEAR_3", "YEAR_4", "YEAR_5", "YEAR_6"];

// Department options — adjust to match the institution's actual offerings.
const DEPARTMENT_OPTIONS = [
  "የመዝሙር ትምህርት",
  "የመሳርያ ትምህርት",
  "የቅኔ ትምህርት",
  "የዜማ ትምህርት",
  "ሌላ"
];

export function StepApplicantInfo({
  state,
  errors,
  onChange,
  departmentRequired
}: {
  state: WizardState;
  errors: Record<string, string>;
  onChange: (patch: Partial<WizardState>) => void;
  departmentRequired: boolean;
}) {
  return (
    <div>
      <h2 className="amharic text-xl font-bold text-ink-900">ተማሪ / ሠራተኛ መረጃ</h2>
      <p className="amharic mt-1 text-sm text-ink-900/60">Applicant type</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {(["STUDENT", "EMPLOYEE"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() =>
              onChange({
                applicantType: type,
                studentYear: type === "EMPLOYEE" ? "" : state.studentYear,
                department: type === "EMPLOYEE" ? "" : state.department
              })
            }
            className={`amharic rounded-xl border-2 px-4 py-4 text-center font-medium transition ${
              state.applicantType === type
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-brand-100 text-ink-900/70 hover:border-brand-300"
            }`}
          >
            {type === "STUDENT" ? "ተማሪ" : "ሠራተኛ"}
          </button>
        ))}
      </div>
      {errors.applicantType && <p className="mt-2 text-sm text-red-600">{errors.applicantType}</p>}

      {state.applicantType === "STUDENT" && (
        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="studentYear" className="amharic block text-sm font-medium text-ink-900">
              ዓመት
            </label>
            <select
              id="studentYear"
              value={state.studentYear}
              onChange={(e) =>
                onChange({
                  studentYear: e.target.value as StudentYear,
                  department: ""
                })
              }
              className="mt-1.5 w-full rounded-xl border border-brand-200 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
            >
              <option value="">ይምረጡ</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {STUDENT_YEAR_LABELS[y]}
                </option>
              ))}
            </select>
            {errors.studentYear && <p className="mt-1 text-sm text-red-600">{errors.studentYear}</p>}
          </div>

          {departmentRequired && (
            <div>
              <label htmlFor="department" className="amharic block text-sm font-medium text-ink-900">
                ትምህርት ክፍል
              </label>
              <select
                id="department"
                value={state.department}
                onChange={(e) => onChange({ department: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-brand-200 px-4 py-3 text-base focus:border-brand-500 focus:outline-none"
              >
                <option value="">ይምረጡ</option>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
