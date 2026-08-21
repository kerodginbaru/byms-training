import { z } from "zod";

const timeSchema = z.string().regex(/^(?:[0-9]|1\d|2[0-3]):[0-5]\d$/, "Use H:mm or HH:mm format.");

export const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address.")
});

export const passwordResetSchema = z.object({
  token: z.string().length(64),
  password: z.string().min(10, "Password must be at least 10 characters.")
});

export const createAdminSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(10, "Password must be at least 10 characters."),
  role: z.enum(["SUPER_ADMIN", "REGISTRATION_ADMIN", "VIEWER"])
});

export const updateAdminEmailSchema = z.object({
  id: z.string().min(1),
  email: z.string().email()
});

export const scheduleSchema = z.object({
  name: z.string().trim().min(1),
  days: z.array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])).min(1),
  session: z.enum(["MORNING", "AFTERNOON"]),
  startTime: timeSchema,
  endTime: timeSchema,
  capacity: z.number().int().min(1).max(500),
  isActive: z.boolean()
});

export const settingsSchema = z.object({
  institutionNameAm: z.string().min(1),
  institutionNameEn: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  location: z.string().min(1),
  contactPersonName: z.string().min(1),
  contactPersonPhone: z.string().min(1),
  heroTitle: z.string().min(1),
  heroDescription: z.string().min(1),
  morningStartTime: timeSchema,
  morningEndTime: timeSchema,
  afternoonStartTime: timeSchema,
  afternoonEndTime: timeSchema,
  registrationOpen: z.boolean(),
  maxUploadSizeMb: z.number().int().min(1).max(25),
  duplicatePhoneScheduleBlock: z.boolean()
});