import { z } from "zod";

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
  packageType: z.enum(["REGULAR", "SPECIAL", "HOME_TO_HOME", "KRAR"], {
    errorMap: () => ({ message: "Please select a package." })
  }),
  scheduleId: z.string().optional().nullable(),
  preferredTime: z.string().trim().max(200).optional().nullable(),
  receiptFileId: z.string().min(1, "Please upload your document."),
  agreedToRegulations: z.literal(true, {
    errorMap: () => ({ message: "Please confirm you accept the training center's regulations." })
  })
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

    if (data.packageType === "REGULAR") {
      if (!data.scheduleId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select your training schedule.",
          path: ["scheduleId"]
        });
      }
    } else {
      if (!data.preferredTime || data.preferredTime.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please tell us your preferred time.",
          path: ["preferredTime"]
        });
      }
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function sanitizeRegistrationPayload(data: RegistrationInput) {
  let result = data;
  if (result.applicantType === "EMPLOYEE") {
    result = { ...result, studentYear: null, department: null };
  } else if (result.studentYear && !YEARS_REQUIRING_DEPARTMENT.has(result.studentYear)) {
    result = { ...result, department: null };
  }
  if (result.packageType === "REGULAR") {
    result = { ...result, preferredTime: null };
  } else {
    result = { ...result, scheduleId: null };
  }
  return result;
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