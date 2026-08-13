import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/rbac";
import { blobUrlFromKey } from "@/lib/storage/blob";

// Authenticated-only receipt access. Never expose the raw blob URL to the
// public; this route verifies the admin session/permission, resolves the
// current blob URL server-side, fetches the bytes, and streams them back
// with the original filename — the person hitting this endpoint never
// needs (or gets) the underlying storage URL.
export async function GET(req: NextRequest, { params }: { params: { fileId: string } }) {
  await requirePermission("payments:read");

  const file = await prisma.uploadedFile.findUnique({ where: { id: params.fileId } });
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  try {
    const url = await blobUrlFromKey(file.storageKey);
    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Unable to retrieve file." }, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${file.originalFilename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (err) {
    console.error("GET /api/admin/receipts/[fileId] failed", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
