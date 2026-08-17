import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sanitizeRegistrationPayload, RegistrationInput } from "@/lib/validation/registration";

export class ScheduleFullError extends Error {
  constructor() {
    super("This schedule is now full. Please select another schedule.");
    this.name = "ScheduleFullError";
  }
}

export class ScheduleUnavailableError extends Error {
  constructor() {
    super("This schedule is not available. Please choose another schedule.");
    this.name = "ScheduleUnavailableError";
  }
}

export class DuplicateRegistrationError extends Error {
  constructor() {
    super(
      "A registration with this phone number already exists for this schedule. " +
        "Please contact the office if you believe this is a mistake."
    );
    this.name = "DuplicateRegistrationError";
  }
}

async function nextRegistrationNumber(tx: Prisma.TransactionClient, year: number) {
  const counter = await tx.registrationCounter.upsert({
    where: { year },
    create: { year, current: 1 },
    update: { current: { increment: 1 } }
  });
  const padded = String(counter.current).padStart(6, "0");
  return `BYMS-${year}-${padded}`;
}

export type CreateRegistrationResult = {
  id: string;
  registrationNumber: string;
};

export async function createRegistration(input: RegistrationInput) {
  const data = sanitizeRegistrationPayload(input);
  const year = new Date().getFullYear();

  if (data.packageType !== "REGULAR") {
    return prisma.$transaction(async (tx) => {
      const settings = await tx.settings.findUnique({ where: { id: 1 } });
      if (settings && !settings.registrationOpen) {
        throw new ScheduleUnavailableError();
      }

      const registrationNumber = await nextRegistrationNumber(tx, year);

      const registration = await tx.registration.create({
        data: {
          registrationNumber,
          fullName: data.fullName,
          phone: data.phone,
          applicantType: data.applicantType,
          studentYear: data.studentYear ?? null,
          department: data.department ?? null,
          packageType: data.packageType,
          preferredTime: data.preferredTime ?? null,
          scheduleId: null,
          agreedToRegulations: data.agreedToRegulations,
          uploadedFiles: {
            connect: { id: data.receiptFileId }
          }
        },
        select: { id: true, registrationNumber: true }
      });

      await tx.auditLog.create({
        data: {
          action: "REGISTRATION_CREATED",
          entityType: "Registration",
          entityId: registration.id,
          registrationId: registration.id,
          metadata: { packageType: data.packageType }
        }
      });

      return registration as CreateRegistrationResult;
    });
  }

  return prisma.$transaction(
    async (tx) => {
      const lockedSchedules = await tx.$queryRaw
        { id: string; capacity: number; isActive: boolean }[]
      >(Prisma.sql`
        SELECT "id", "capacity", "isActive"
        FROM "Schedule"
        WHERE "id" = ${data.scheduleId}
        FOR UPDATE
      `);

      const schedule = lockedSchedules[0];
      if (!schedule || !schedule.isActive) {
        throw new ScheduleUnavailableError();
      }

      const settings = await tx.settings.findUnique({ where: { id: 1 } });
      if (settings && !settings.registrationOpen) {
        throw new ScheduleUnavailableError();
      }

      const reservedCount = await tx.registration.count({
        where: { scheduleId: schedule.id }
      });

      if (reservedCount >= schedule.capacity) {
        throw new ScheduleFullError();
      }

      if (settings?.duplicatePhoneScheduleBlock !== false) {
        const duplicate = await tx.registration.findFirst({
          where: { phone: data.phone, scheduleId: schedule.id }
        });
        if (duplicate) {
          throw new DuplicateRegistrationError();
        }
      }

      const registrationNumber = await nextRegistrationNumber(tx, year);

      const registration = await tx.registration.create({
        data: {
          registrationNumber,
          fullName: data.fullName,
          phone: data.phone,
          applicantType: data.applicantType,
          studentYear: data.studentYear ?? null,
          department: data.department ?? null,
          packageType: "REGULAR",
          scheduleId: schedule.id,
          agreedToRegulations: data.agreedToRegulations,
          uploadedFiles: {
            connect: { id: data.receiptFileId }
          }
        },
        select: { id: true, registrationNumber: true }
      });

      await tx.auditLog.create({
        data: {
          action: "REGISTRATION_CREATED",
          entityType: "Registration",
          entityId: registration.id,
          registrationId: registration.id,
          metadata: { scheduleId: schedule.id }
        }
      });

      return registration as CreateRegistrationResult;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function getScheduleAvailability() {
  const schedules = await prisma.schedule.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });

  const counts = await prisma.registration.groupBy({
    by: ["scheduleId"],
    _count: { _all: true }
  });

  const countMap = new Map(counts.map((c) => [c.scheduleId, c._count._all]));

  return schedules.map((s) => {
    const registered = countMap.get(s.id) ?? 0;
    return {
      ...s,
      registered,
      remaining: Math.max(0, s.capacity - registered),
      isFull: registered >= s.capacity
    };
  });
}

export async function deleteRegistration(registrationId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.registration.findUnique({ where: { id: registrationId } });
    if (!existing) return null;

    await tx.registration.delete({ where: { id: registrationId } });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "REGISTRATION_DELETED",
        entityType: "Registration",
        entityId: registrationId,
        metadata: { registrationNumber: existing.registrationNumber }
      }
    });

    return existing;
  });
}