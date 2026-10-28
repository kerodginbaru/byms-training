import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { PDFDocument, rgb } from "pdf-lib";
// @ts-ignore - pdf-lib uses fontkit for custom font embedding.
import fontkit from "@pdf-lib/fontkit";
import fs from "fs/promises";
import path from "path";
import { CONFESSOR_PARISH_LABELS, PACKAGE_LABELS } from "@/components/registration/types";
import { STUDENT_YEAR_LABELS, SESSION_LABELS, formatDays } from "@/lib/utils/labels";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const FONT_PATH = path.join(process.cwd(), "public/certificates/NotoSerifEthiopic-Regular.ttf");
const MARGIN = 48;
const FONT_SIZE = 10;
const LINE_HEIGHT = 15;

function wrapText(text: string, font: ReturnType<PDFDocument["embedFont"]> extends Promise<infer T> ? T : never, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, FONT_SIZE) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

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

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit as any);
  const fontBytes = await fs.readFile(FONT_PATH);
  const font = await pdf.embedFont(new Uint8Array(fontBytes), { subset: true });

  const entries = registrations.length ? registrations : [null];
  for (const registration of entries) {
    const page = pdf.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    let y = height - MARGIN;

    const title = registration ? registration.registrationNumber : "No registrations found";
    page.drawText(title, { x: MARGIN, y, size: 17, font, color: rgb(0.12, 0.2, 0.28) });
    y -= 25;

    if (!registration) continue;

    const confessorParish = registration.confessorParish
      ? CONFESSOR_PARISH_LABELS[registration.confessorParish]
      : "Not provided";
    const schedule = registration.schedule;
    const uploadedDocuments = registration.uploadedFiles
      .filter((file) => file.kind === "DOCUMENT")
      .map((file) => `${file.originalFilename} (${file.mimeType}, ${file.size.toLocaleString()} bytes)`)
      .join("; ") || "None";

    const fields: [string, string][] = [
      ["Full name", registration.fullName],
      ["Phone", registration.phone],
      ["Christian name", registration.christianName ?? "Not provided"],
      ["Teseto", registration.teseto ?? "Not provided"],
      ["የንስሃ አባት parish", confessorParish],
      ["የንስሃ አባት name", registration.confessorName ?? "Not provided"],
      ["Applicant type", registration.applicantType],
      ["Student year", registration.studentYear ? STUDENT_YEAR_LABELS[registration.studentYear] : "Not applicable"],
      ["Instrument", registration.department ?? "Not provided"],
      ["Package", PACKAGE_LABELS[registration.packageType]],
      ["Schedule", schedule?.name ?? "Individually arranged"],
      ["Schedule days", schedule ? formatDays(schedule.days) : "Not applicable"],
      ["Session", schedule ? SESSION_LABELS[schedule.session] : "Not applicable"],
      ["Training time", schedule ? `${schedule.startTime}–${schedule.endTime}` : registration.preferredTime ?? "Not provided"],
      ["Regulations accepted", registration.agreedToRegulations ? "Yes" : "No"],
      ["Uploaded document", uploadedDocuments],
      ["Registered", new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short" }).format(registration.createdAt)],
      ["Last updated", new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short" }).format(registration.updatedAt)]
    ];

    for (const [label, value] of fields) {
      const lines = wrapText(`${label}: ${value}`, font, width - MARGIN * 2);
      for (const line of lines) {
        if (y < MARGIN) {
          const nextPage = pdf.addPage([595.28, 841.89]);
          y = nextPage.getHeight() - MARGIN;
        }
        const currentPage = pdf.getPages()[pdf.getPageCount() - 1];
        currentPage.drawText(line, { x: MARGIN, y, size: FONT_SIZE, font, color: rgb(0.12, 0.16, 0.2) });
        y -= LINE_HEIGHT;
      }
    }
  }

  const bytes = await pdf.save();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="student-details-${new Date().toISOString().slice(0, 10)}.pdf"`
    }
  });
}