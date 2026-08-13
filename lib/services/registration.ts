import "server-only";
import { Prisma, RegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sanitizeRegistrationPayload, RegistrationInput } from "@/lib/validation/registration";

// ---------------------------------------------------------------------------
// Capacity rule (documented, per spec section 7):
// A seat is considered "reserved" by any registration whose status is
// PENDING or APPROVED. REJECTED and CANCELLED registrations free the seat.
// This is the single source of truth for capacity counting — every place
// that needs a seat count (public schedule list, admin dashboard, the
// registration transaction itself) must use RESERVING_STATUSES.
// ---------------------------------------------------------------------------
export const RESERVING_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.PENDING,
  RegistrationStatus.APPROVED
];

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

/**
 * Generates the next sequential registration number for the given year using an
 * atomic UPDATE ... RETURNING against a dedicated counter row. This is safe under
 * concurrency because the increment happens inside the same transaction that also
 * checks/reserves schedule capacity, and Postgres row locks serialize concurrent
 * updates to the same counter row.
 */
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

/**
 * Creates a registration inside a single serializable-ish transaction that:
 *   1. Locks/reads the schedule row
 *   2. Confirms the schedule is active
 *   3. Counts currently-reserving registrations for that schedule
 *   4. Rejects if capacity is already reached (capacity is enforced here,
 *      NOT just in the UI — this is the authoritative check)
 *   5. Optionally rejects duplicate phone+schedule combinations
 *   6. Generates a unique sequential registration number
 *   7. Creates the registration + payment + links the uploaded receipt file
 *
 * Postgres row-level locking (`FOR UPDATE` via queryRaw on the schedule row)
 * ensures that two near-simultaneous submissions for the last remaining seat
 * cannot both pass the capacity check.
 */
export async function createRegistration(input: RegistrationInput) {
  const data = sanitizeRegistrationPayload(input);
  const year = new Date().getFullYear();

  return prisma.$transaction(
    async (tx) => {
      // Lock the schedule row for the duration of this transaction so that
      // concurrent submissions targeting the same schedule are serialized.
      const lockedSchedules = await tx.$queryRaw<
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
        where: {
          scheduleId: schedule.id,
          registrationStatus: { in: RESERVING_STATUSES }
        }
      });

      if (reservedCount >= schedule.capacity) {
        throw new ScheduleFullError();
      }

      if (settings?.duplicatePhoneScheduleBlock !== false) {
        const duplicate = await tx.registration.findFirst({
          where: {
            phone: data.phone,
            scheduleId: schedule.id,
            registrationStatus: { in: RESERVING_STATUSES }
          }
        });
        if (duplicate) {
          throw new DuplicateRegistrationError();
        }
      }

      const registrationNumber = await nextRegistrationNumber(tx, year);

      const registrationFee = settings?.registrationFee ?? 0;
      const firstMonthFee = settings?.firstMonthFee ?? 0;
      const totalAmount = Number(registrationFee) + Number(firstMonthFee);

      const registration = await tx.registration.create({
        data: {
          registrationNumber,
          fullName: data.fullName,
          phone: data.phone,
          applicantType: data.applicantType,
          studentYear: data.studentYear ?? null,
          department: data.department ?? null,
          scheduleId: schedule.id,
          registrationStatus: RegistrationStatus.PENDING,
          uploadedFiles: {
            connect: { id: data.receiptFileId }
          },
          payment: {
            create: {
              registrationFee,
              firstMonthFee,
              totalAmount,
              receiptFileId: data.receiptFileId
            }
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

/** Seat availability for the public schedule list. */
export async function getScheduleAvailability() {
  const schedules = await prisma.schedule.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });

  const counts = await prisma.registration.groupBy({
    by: ["scheduleId"],
    where: { registrationStatus: { in: RESERVING_STATUSES } },
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
