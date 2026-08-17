import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/rbac";
import { Prisma } from "@prisma/client";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  await requirePermission("reports:read");

  const { searchParams } = new URL(req.url);
  const where: Prisma.RegistrationWhereInput = {};
  const q = searchParams.get("q");
  const type = searchParams.get("type");
  const packageType = searchParams.get("packageType");
  const scheduleId = searchParams.get("scheduleId");

  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { registrationNumber: { contains: q, mode: "insensitive" } }
    ];
  }
  if (type) where.applicantType = type as any;
  if (packageType) where.packageType = packageType as any;
  if (scheduleId) where.scheduleId = scheduleId;

  const registrations = await prisma.registration.findMany({
    where,
    include: { schedule: true },
    orderBy: { createdAt: "desc" }
  });

  const headers = [
    "Registration Number",
    "Full Name",
    "Phone",
    "Type",
    "Year",
    "Instrument",
    "Package",
    "Schedule",
    "Preferred Time",
    "Created At"
  ];

  const rows = registrations.map((r) =>
    [
      r.registrationNumber,
      r.fullName,
      r.phone,
      r.applicantType,
      r.studentYear ?? "",
      r.department ?? "",
      r.packageType,
      r.schedule?.name ?? "",
      r.preferredTime ?? "",
      r.createdAt.toISOString()
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}