import "server-only";
import { PDFDocument, rgb } from "pdf-lib";
// @ts-ignore - no bundled types, but this is the correct/standard import for pdf-lib's fontkit integration
import fontkit from "@pdf-lib/fontkit";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.join(process.cwd(), "public/certificates/template.pdf");
const FONT_PATH = path.join(process.cwd(), "public/certificates/NotoSerifEthiopic-Regular.ttf");

// Calibrated against the real template (A4 landscape, 841.92 x 595.2 pts).
// Fractions of page width/height. Nudge if name/photo look off after a real test.
const NAME_POSITION = { xFrac: 0.13, yFracFromTop: 0.648, fontSize: 16 };
const PHOTO_BOX = { xFrac: 0.028, yFracFromTop: 0.095, widthFrac: 0.135, heightFrac: 0.195 };

export async function generateCertificatePdf({
  fullName,
  photoBytes,
  photoMimeType
}: {
  fullName: string;
  photoBytes: Uint8Array;
  photoMimeType: string;
}): Promise<Uint8Array> {
  const templateBytes = await fs.readFile(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit as any);

  const fontBytes = await fs.readFile(FONT_PATH);
  const font = await pdfDoc.embedFont(fontBytes, { subset: true });

  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  const photoImage =
    photoMimeType === "image/png"
      ? await pdfDoc.embedPng(photoBytes)
      : await pdfDoc.embedJpg(photoBytes);

  const boxX = PHOTO_BOX.xFrac * width;
  const boxY = height - PHOTO_BOX.yFracFromTop * height - PHOTO_BOX.heightFrac * height;
  const boxW = PHOTO_BOX.widthFrac * width;
  const boxH = PHOTO_BOX.heightFrac * height;

  const imgAspect = photoImage.width / photoImage.height;
  const boxAspect = boxW / boxH;
  let drawW = boxW;
  let drawH = boxH;
  if (imgAspect > boxAspect) {
    drawH = boxH;
    drawW = boxH * imgAspect;
  } else {
    drawW = boxW;
    drawH = boxW / imgAspect;
  }
  const drawX = boxX + (boxW - drawW) / 2;
  const drawY = boxY + (boxH - drawH) / 2;

  page.drawImage(photoImage, { x: drawX, y: drawY, width: drawW, height: drawH });

  const nameX = NAME_POSITION.xFrac * width;
  const nameY = height - NAME_POSITION.yFracFromTop * height;
  page.drawText(fullName, {
    x: nameX,
    y: nameY,
    size: NAME_POSITION.fontSize,
    font,
    color: rgb(0.1, 0.1, 0.1)
  });

  return pdfDoc.save();
}