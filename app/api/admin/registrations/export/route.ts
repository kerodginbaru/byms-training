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
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const scheduleId = searchParams.get("scheduleId");

  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { registrationNumber: { contains: q, mode: "insensitive" } }
    ];
  }
  if (status) where.registrationStatus = status as any;
  if (type) where.applicantType = type as any;
  if (scheduleId) where.scheduleId = scheduleId;

  const registrations = await prisma.registration.findMany({
    where,
    include: { schedule: true, payment: true },
    orderBy: { createdAt: "desc" }
  });

  const headers = [
    "Registration Number",
    "Full Name",
    "Phone",
    "Type",
    "Year",
    "Department",
    "Schedule",
    "Payment Status",
    "Registration Status",
    "Total Amount",
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
      r.schedule.name,
      r.payment?.status ?? "",
      r.registrationStatus,
      r.payment ? String(r.payment.totalAmount) : "",
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
