import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { Prisma } from "@prisma/client";
import { CONFESSOR_PARISH_LABELS, PACKAGE_LABELS } from "@/components/registration/types";
import { STUDENT_YEAR_LABELS } from "@/lib/utils/labels";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requirePermission("registrations:read");

  const searchParams = request.nextUrl.searchParams;
  const where: Prisma.RegistrationWhereInput = {};
  const q = searchParams.get("q");
  const type = searchParams.get("type");
  const packageType = searchParams.get("packageType");
  const scheduleId = searchParams.get("scheduleId");
  const instrument = searchParams.get("instrument");
  const shiftId = searchParams.get("shiftId");

  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { registrationNumber: { contains: q, mode: "insensitive" } }
    ];
  }
  if (type) where.applicantType = type as Prisma.EnumApplicantTypeFilter["equals"];
  if (packageType) where.packageType = packageType as Prisma.EnumPackageTypeFilter["equals"];
  if (scheduleId) where.scheduleId = scheduleId;
  if (instrument) where.department = instrument;

  if (shiftId) {
    try {
      const [groupKey, groupInstrument] = JSON.parse(shiftId) as [string, string | null];
      if (groupInstrument) where.department = groupInstrument;
      if (groupKey.startsWith("preferred-")) {
        where.id = groupKey.slice("preferred-".length);
      } else {
        const matchingSchedule = await prisma.schedule.findUnique({
          where: { id: groupKey },
          select: { id: true }
        });
        if (matchingSchedule) where.scheduleId = groupKey;
        else where.preferredTime = groupKey;
      }
    } catch {
      where.scheduleId = shiftId;
    }
  }
  if (searchParams.get("missingConfessor") === "true") {
    where.AND = [{ OR: [{ confessorParish: "NONE" }, { confessorParish: null }] }];
  }

  const registrations = await prisma.registration.findMany({
    where,
    select: {
      fullName: true,
      phone: true,
      christianName: true,
      teseto: true,
      confessorParish: true,
      confessorName: true,
      applicantType: true,
      studentYear: true,
      department: true,
      packageType: true,
      schedule: true
    },
    orderBy: { createdAt: "desc" }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bete-Yared Training Center";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Student registrations", {
    views: [{ state: "frozen", ySplit: 1 }]
  });
  sheet.columns = [
    { header: "Full Name", key: "fullName", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Christian Name", key: "christianName", width: 22 },
    { header: "Teseto", key: "teseto", width: 22 },
    { header: "Confessor Parish", key: "confessorParish", width: 24 },
    { header: "Confessor Name", key: "confessorName", width: 24 },
    { header: "Applicant Type", key: "applicantType", width: 16 },
    { header: "Student Year", key: "studentYear", width: 20 },
    { header: "Instrument", key: "instrument", width: 18 },
    { header: "Package", key: "package", width: 24 },
    { header: "Schedule", key: "schedule", width: 24 }
  ];

  const header = sheet.getRow(1);
  header.height = 30;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF204B5A" } };
  header.alignment = { vertical: "middle", wrapText: true };

  for (const [index, registration] of registrations.entries()) {
    const row = sheet.addRow({
      fullName: registration.fullName,
      phone: registration.phone,
      christianName: registration.christianName ?? "",
      teseto: registration.teseto ?? "",
      confessorParish: registration.confessorParish
        ? CONFESSOR_PARISH_LABELS[registration.confessorParish]
        : "Not provided",
      confessorName: registration.confessorName ?? "",
      applicantType: registration.applicantType,
      studentYear: registration.studentYear ? STUDENT_YEAR_LABELS[registration.studentYear] : "",
      instrument: registration.department ?? "",
      package: PACKAGE_LABELS[registration.packageType],
      schedule: registration.schedule?.name ?? "Individually arranged"
    });
    row.height = 30;
    row.alignment = { vertical: "top", wrapText: true };
    if (index % 2 === 1) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F5F6" } };
    }
  }

  sheet.autoFilter = `A1:K${sheet.rowCount}`;

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `student-registrations-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}