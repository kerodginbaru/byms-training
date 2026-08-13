import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadReceipt } from "@/lib/storage/blob";
import { validateFileSize } from "@/lib/validation/registration";

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "application/pdf"]);

// Public endpoint used by the registration wizard to upload a receipt BEFORE the
// registration itself is created. Returns an UploadedFile id that the final
// registration submit step references. This keeps the multi-step UX simple
// (upload once, not re-uploaded on every step) while still validating
// everything server-side, never trusting the browser's file input alone.
export async function POST(req: NextRequest) {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const maxMb = settings?.maxUploadSizeMb ?? 5;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was received." }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload JPG, PNG, or PDF." },
        { status: 400 }
      );
    }

    if (!validateFileSize(file.size, maxMb)) {
      return NextResponse.json(
        { error: `Your payment receipt is too large. Maximum size is ${maxMb}MB.` },
        { status: 400 }
      );
    }

    const uploaded = await uploadReceipt(file);

    const record = await prisma.uploadedFile.create({
      data: {
        kind: "RECEIPT",
        storageKey: uploaded.storageKey,
        originalFilename: uploaded.originalFilename,
        mimeType: uploaded.mimeType,
        size: uploaded.size
      }
    });

    return NextResponse.json({ fileId: record.id, filename: record.originalFilename });
  } catch (err) {
    console.error("POST /api/uploads/receipt failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
