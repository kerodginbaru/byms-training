import "server-only";
import { prisma } from "@/lib/db";

export { deleteRegistration } from "./registration";

export async function getDashboardStats() {
  const [total, students, employees, byPackage, schedules] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { applicantType: "STUDENT" } }),
    prisma.registration.count({ where: { applicantType: "EMPLOYEE" } }),
    prisma.registration.groupBy({ by: ["packageType"], _count: { _all: true } }),
    prisma.schedule.findMany({ where: { isActive: true } })
  ]);

  const regularCounts = await prisma.registration.groupBy({
    by: ["scheduleId"],
    where: { packageType: "REGULAR" },
    _count: { _all: true }
  });
  const countMap = new Map(regularCounts.map((c) => [c.scheduleId, c._count._all]));
  const fullSchedules = schedules.filter((s) => (countMap.get(s.id) ?? 0) >= s.capacity).length;
  const availableSeats = schedules.reduce(
    (sum, s) => sum + Math.max(0, s.capacity - (countMap.get(s.id) ?? 0)),
    0
  );

  const packageCounts: Record<string, number> = {};
  byPackage.forEach((p) => {
    packageCounts[p.packageType] = p._count._all;
  });

  return {
    total,
    students,
    employees,
    packageCounts,
    availableSeats,
    fullSchedules
  };
}