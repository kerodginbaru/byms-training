import { z } from "zod";

// ---------------------------------------------------------------------------
// Ethiopian phone number handling
// Accepts: 09XXXXXXXX, 07XXXXXXXX, +2519XXXXXXXX, +2517XXXXXXXX, 2519XXXXXXXX
// Normalizes to: 2519XXXXXXXX / 2517XXXXXXXX (no plus, 12 digits)
// ---------------------------------------------------------------------------
export function normalizeEthiopianPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "");
  let match: RegExpMatchArray | null;

  if ((match = digits.match(/^\+?251(9\d{8}|7\d{8})$/))) {
    return `251${match[1]}`;
  }
  if ((match = digits.match(/^0(9\d{8}|7\d{8})$/))) {
    return `251${match[1]}`;
  }
  return null;
}

const phoneSchema = z
  .string()
  .min(1, "ስልክ ቁጥር ያስፈልጋል / Phone number is required")
  .transform((val, ctx) => {
    const normalized = normalizeEthiopianPhone(val);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a valid Ethiopian phone number (e.g. 09XXXXXXXX)."
      });
      return z.NEVER;
    }
    return normalized;
  });

export const STUDENT_YEAR_VALUES = [
  "REMEDIAL",
  "YEAR_1",
  "YEAR_2",
  "YEAR_3",
  "YEAR_4",
  "YEAR_5",
  "YEAR_6"
] as const;

const YEARS_REQUIRING_DEPARTMENT = new Set(["YEAR_2", "YEAR_3", "YEAR_4", "YEAR_5", "YEAR_6"]);

// Base object shape (pre-refinement) so we can reuse .shape in step-level partial validation.
const baseRegistrationShape = {
  fullName: z
    .string()
    .trim()
    .min(3, "Please enter your full name.")
    .max(150, "Full name is too long."),
  phone: phoneSchema,
  applicantType: z.enum(["STUDENT", "EMPLOYEE"], {
    errorMap: () => ({ message: "Please select applicant type." })
  }),
  studentYear: z.enum(STUDENT_YEAR_VALUES).optional().nullable(),
  department: z.string().trim().max(150).optional().nullable(),
  scheduleId: z.string().min(1, "Please select your training schedule."),
  receiptFileId: z.string().min(1, "Please upload your payment receipt.")
};

export const registrationSchema = z
  .object(baseRegistrationShape)
  .superRefine((data, ctx) => {
    if (data.applicantType === "STUDENT") {
      if (!data.studentYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select your year.",
          path: ["studentYear"]
        });
        return;
      }
      if (YEARS_REQUIRING_DEPARTMENT.has(data.studentYear)) {
        if (!data.department || data.department.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select your department.",
            path: ["department"]
          });
        }
      }
    }

    if (data.applicantType === "EMPLOYEE") {
      // Employees must not carry student-only fields.
      if (data.studentYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Year should not be set for employees.",
          path: ["studentYear"]
        });
      }
      if (data.department) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Department should not be set for employees.",
          path: ["department"]
        });
      }
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

// Server-side normalization step: strips student fields for employees, and drops
// department when year doesn't require it, regardless of what the client sent.
export function sanitizeRegistrationPayload(data: RegistrationInput) {
  if (data.applicantType === "EMPLOYEE") {
    return { ...data, studentYear: null, department: null };
  }
  if (data.studentYear && !YEARS_REQUIRING_DEPARTMENT.has(data.studentYear)) {
    return { ...data, department: null };
  }
  return data;
}

export const fileUploadSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/jpg", "image/png", "application/pdf"], {
    errorMap: () => ({ message: "Unsupported file type. Please upload JPG, PNG, or PDF." })
  }),
  size: z.number().positive()
});

export function validateFileSize(sizeBytes: number, maxMb: number) {
  const maxBytes = maxMb * 1024 * 1024;
  return sizeBytes <= maxBytes;
}
