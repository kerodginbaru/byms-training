import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { Prisma } from "@prisma/client";
import { CONFESSOR_PARISH_LABELS, PACKAGE_LABELS } from "@/components/registration/types";
import { SESSION_LABELS, STUDENT_YEAR_LABELS, formatDays } from "@/lib/utils/labels";
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
    include: { schedule: true, uploadedFiles: true },
    orderBy: { createdAt: "desc" }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bete-Yared Training Center";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Student registrations", {
    views: [{ state: "frozen", ySplit: 1 }]
  });
  sheet.columns = [
    { header: "Registration Number", key: "registrationNumber", width: 23 },
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
    { header: "Schedule", key: "schedule", width: 24 },
    { header: "Schedule Days", key: "scheduleDays", width: 22 },
    { header: "Session", key: "session", width: 16 },
    { header: "Training Time", key: "trainingTime", width: 22 },
    { header: "Preferred Time", key: "preferredTime", width: 24 },
    { header: "Regulations Accepted", key: "regulationsAccepted", width: 22 },
    { header: "Uploaded Document", key: "uploadedDocument", width: 40 },
    { header: "Registered At", key: "registeredAt", width: 24 },
    { header: "Last Updated", key: "lastUpdated", width: 24 }
  ];

  const header = sheet.getRow(1);
  header.height = 30;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF204B5A" } };
  header.alignment = { vertical: "middle", wrapText: true };

  for (const [index, registration] of registrations.entries()) {
    const schedule = registration.schedule;
    const documents = registration.uploadedFiles
      .filter((file) => file.kind === "DOCUMENT")
      .map((file) => file.originalFilename)
      .join("; ");

    const row = sheet.addRow({
      registrationNumber: registration.registrationNumber,
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
      schedule: schedule?.name ?? "Individually arranged",
      scheduleDays: schedule ? formatDays(schedule.days) : "",
      session: schedule ? SESSION_LABELS[schedule.session] : "",
      trainingTime: schedule ? `${schedule.startTime}-${schedule.endTime}` : "",
      preferredTime: registration.preferredTime ?? "",
      regulationsAccepted: registration.agreedToRegulations ? "Yes" : "No",
      uploadedDocument: documents,
      registeredAt: registration.createdAt,
      lastUpdated: registration.updatedAt
    });
    row.height = 30;
    row.alignment = { vertical: "top", wrapText: true };
    if (index % 2 === 1) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F5F6" } };
    }
  }

  sheet.autoFilter = `A1:T${sheet.rowCount}`;
  sheet.getColumn("registeredAt").numFmt = "dd mmm yyyy hh:mm";
  sheet.getColumn("lastUpdated").numFmt = "dd mmm yyyy hh:mm";

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `student-registrations-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}