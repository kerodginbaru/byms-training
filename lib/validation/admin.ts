import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const createAdminSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(10, "Password must be at least 10 characters."),
  role: z.enum(["SUPER_ADMIN", "REGISTRATION_ADMIN", "VIEWER"])
});

export const scheduleSchema = z.object({
  name: z.string().trim().min(1),
  days: z.array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])).min(1),
  session: z.enum(["MORNING", "AFTERNOON"]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use 24h HH:mm format."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use 24h HH:mm format."),
  capacity: z.number().int().min(1).max(500),
  isActive: z.boolean()
});

export const settingsSchema = z.object({
  institutionNameAm: z.string().min(1),
  institutionNameEn: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  location: z.string().min(1),
  contactPersonName: z.string().min(1),
  contactPersonPhone: z.string().min(1),
  heroTitle: z.string().min(1),
  heroDescription: z.string().min(1),
  morningStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  morningEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  afternoonStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  afternoonEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  registrationOpen: z.boolean(),
  maxUploadSizeMb: z.number().int().min(1).max(25),
  duplicatePhoneScheduleBlock: z.boolean()
});