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
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const FONT_SIZE = 12;
const LINE_HEIGHT = 17;
const CELL_PADDING = 8;
const LABEL_WIDTH = 170;

function wrapText(
  text: string,
  font: ReturnType<PDFDocument["embedFont"]> extends Promise<infer T> ? T : never,
  maxWidth: number
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (font.widthOfTextAtSize(word, FONT_SIZE) > maxWidth) {
      if (line) lines.push(line);
      line = "";
      let segment = "";
      for (const character of word) {
        const candidate = segment + character;
        if (font.widthOfTextAtSize(candidate, FONT_SIZE) > maxWidth && segment) {
          lines.push(segment);
          segment = character;
        } else {
          segment = candidate;
        }
      }
      line = segment;
      continue;
    }
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
    const title = registration
      ? `${registration.fullName} · ${registration.registrationNumber}`
      : "No registrations found";
    let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    function drawTableHeader() {
      const { width, height } = page.getSize();
      let cursorY = height - MARGIN;
      page.drawText(title, {
        x: MARGIN,
        y: cursorY,
        size: 16,
        font,
        color: rgb(0.1, 0.2, 0.29)
      });
      cursorY -= 28;
      const tableWidth = width - MARGIN * 2;
      page.drawRectangle({
        x: MARGIN,
        y: cursorY - 5,
        width: tableWidth,
        height: 25,
        color: rgb(0.12, 0.28, 0.36)
      });
      page.drawText("Field", {
        x: MARGIN + CELL_PADDING,
        y: cursorY + 2,
        size: 11,
        font,
        color: rgb(1, 1, 1)
      });
      page.drawText("Student information", {
        x: MARGIN + LABEL_WIDTH + CELL_PADDING,
        y: cursorY + 2,
        size: 11,
        font,
        color: rgb(1, 1, 1)
      });
      page.drawLine({
        start: { x: MARGIN + LABEL_WIDTH, y: cursorY - 5 },
        end: { x: MARGIN + LABEL_WIDTH, y: cursorY + 20 },
        thickness: 0.8,
        color: rgb(0.75, 0.82, 0.84)
      });
      return cursorY - 5;
    }

    let y = drawTableHeader();

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

    const tableWidth = PAGE_WIDTH - MARGIN * 2;
    for (const [rowIndex, [label, value]] of fields.entries()) {
      const labelLines = wrapText(label, font, LABEL_WIDTH - CELL_PADDING * 2);
      const valueLines = wrapText(value, font, tableWidth - LABEL_WIDTH - CELL_PADDING * 2);
      const rowHeight = Math.max(labelLines.length, valueLines.length) * LINE_HEIGHT + CELL_PADDING * 2;

      if (y - rowHeight < MARGIN) {
        page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = drawTableHeader();
      }

      const rowBottom = y - rowHeight;
      page.drawRectangle({
        x: MARGIN,
        y: rowBottom,
        width: tableWidth,
        height: rowHeight,
        color: rowIndex % 2 === 0 ? rgb(0.95, 0.97, 0.97) : rgb(1, 1, 1),
        borderColor: rgb(0.82, 0.86, 0.87),
        borderWidth: 0.5
      });
      page.drawLine({
        start: { x: MARGIN + LABEL_WIDTH, y: rowBottom },
        end: { x: MARGIN + LABEL_WIDTH, y },
        thickness: 0.5,
        color: rgb(0.82, 0.86, 0.87)
      });

      labelLines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: MARGIN + CELL_PADDING,
          y: y - CELL_PADDING - FONT_SIZE - lineIndex * LINE_HEIGHT,
          size: FONT_SIZE,
          font,
          color: rgb(0.15, 0.25, 0.3)
        });
      });
      valueLines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: MARGIN + LABEL_WIDTH + CELL_PADDING,
          y: y - CELL_PADDING - FONT_SIZE - lineIndex * LINE_HEIGHT,
          size: FONT_SIZE,
          font,
          color: rgb(0.12, 0.16, 0.2)
        });
      });
      y = rowBottom;
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