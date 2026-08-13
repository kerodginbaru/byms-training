import "server-only";
import { prisma } from "@/lib/db";
import { PaymentStatus, RegistrationStatus } from "@prisma/client";

export async function approveRegistration(registrationId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const reg = await tx.registration.update({
      where: { id: registrationId },
      data: { registrationStatus: RegistrationStatus.APPROVED }
    });
    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "REGISTRATION_APPROVED",
        entityType: "Registration",
        entityId: registrationId,
        registrationId
      }
    });
    return reg;
  });
}

export async function rejectRegistration(registrationId: string, adminId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const reg = await tx.registration.update({
      where: { id: registrationId },
      data: { registrationStatus: RegistrationStatus.REJECTED }
    });
    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "REGISTRATION_REJECTED",
        entityType: "Registration",
        entityId: registrationId,
        registrationId,
        metadata: reason ? { reason } : undefined
      }
    });
    return reg;
  });
}

export async function verifyPayment(registrationId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { registrationId },
      data: {
        status: PaymentStatus.VERIFIED,
        verifiedById: adminId,
        verifiedAt: new Date(),
        rejectionReason: null
      }
    });
    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "PAYMENT_VERIFIED",
        entityType: "Payment",
        entityId: payment.id,
        registrationId
      }
    });
    return payment;
  });
}

export async function rejectPayment(registrationId: string, adminId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { registrationId },
      data: {
        status: PaymentStatus.REJECTED,
        verifiedById: adminId,
        verifiedAt: new Date(),
        rejectionReason: reason
      }
    });
    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "PAYMENT_REJECTED",
        entityType: "Payment",
        entityId: payment.id,
        registrationId,
        metadata: { reason }
      }
    });
    return payment;
  });
}

export async function getDashboardStats() {
  const [
    total,
    pending,
    approved,
    rejected,
    students,
    employees,
    paymentsVerified,
    paymentsPending,
    schedules
  ] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { registrationStatus: "PENDING" } }),
    prisma.registration.count({ where: { registrationStatus: "APPROVED" } }),
    prisma.registration.count({ where: { registrationStatus: "REJECTED" } }),
    prisma.registration.count({ where: { applicantType: "STUDENT" } }),
    prisma.registration.count({ where: { applicantType: "EMPLOYEE" } }),
    prisma.payment.aggregate({ where: { status: "VERIFIED" }, _sum: { totalAmount: true } }),
    prisma.payment.count({ where: { status: "PENDING_VERIFICATION" } }),
    prisma.schedule.findMany({ where: { isActive: true } })
  ]);

  const regCounts = await prisma.registration.groupBy({
    by: ["scheduleId"],
    where: { registrationStatus: { in: ["PENDING", "APPROVED"] } },
    _count: { _all: true }
  });
  const countMap = new Map(regCounts.map((c) => [c.scheduleId, c._count._all]));
  const fullSchedules = schedules.filter((s) => (countMap.get(s.id) ?? 0) >= s.capacity).length;
  const availableSeats = schedules.reduce(
    (sum, s) => sum + Math.max(0, s.capacity - (countMap.get(s.id) ?? 0)),
    0
  );

  return {
    total,
    pending,
    approved,
    rejected,
    students,
    employees,
    totalPaymentsVerified: Number(paymentsVerified._sum.totalAmount ?? 0),
    paymentsPending,
    availableSeats,
    fullSchedules
  };
}
