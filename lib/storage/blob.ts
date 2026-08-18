import "server-only";
import { put, del, head } from "@vercel/blob";
import { nanoid } from "nanoid";

/**
 * All receipts/images are uploaded with `access: "private"`-equivalent behavior:
 * Vercel Blob URLs are unguessable (random pathnames) and we never surface the
 * raw blob URL to the public. Admin downloads go through an authenticated
 * server route (/admin/api/receipts/[fileId]) that streams the file after
 * verifying the session, rather than linking directly to blob storage.
 *
 * The Blob store's read/write token is stored under UPLOADS_READ_WRITE_TOKEN
 * (not the SDK's default BLOB_READ_WRITE_TOKEN name — that name was already
 * taken by an earlier store connection), so every call below passes it
 * explicitly. BLOB_READ_WRITE_TOKEN is kept as a fallback for local setups
 * that haven't renamed it.
 */

const BLOB_TOKEN = process.env.UPLOADS_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;

const RECEIPTS_PREFIX = "receipts";
const IMAGES_PREFIX = "site-images";

export async function uploadReceipt(file: File) {
  const randomName = `${nanoid(24)}`;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const pathname = `${RECEIPTS_PREFIX}/${randomName}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
    token: BLOB_TOKEN
  });

  return {
    storageKey: blob.pathname,
    url: blob.url,
    mimeType: file.type,
    size: file.size,
    originalFilename: file.name
  };
}

export async function uploadSiteImage(file: File, kind: string) {
  const randomName = nanoid(16);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const pathname = `${IMAGES_PREFIX}/${kind.toLowerCase()}-${randomName}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
    token: BLOB_TOKEN
  });

  return {
    storageKey: blob.pathname,
    url: blob.url,
    mimeType: file.type,
    size: file.size,
    originalFilename: file.name
  };
}

export async function deleteBlob(storageKey: string) {
  await del(storageKey, { token: BLOB_TOKEN });
}

const CERTIFICATES_PREFIX = "certificates";
const CERTIFICATE_PHOTOS_PREFIX = "certificate-photos";

/** Uploads raw bytes (e.g. a generated certificate PDF) rather than a browser File. */
export async function uploadCertificatePdf(bytes: Uint8Array, registrationId: string) {
  const randomName = nanoid(20);
  const pathname = `${CERTIFICATES_PREFIX}/${registrationId}-${randomName}.pdf`;
  const blob = await put(pathname, Buffer.from(bytes), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/pdf",
    token: BLOB_TOKEN
  });
  return { storageKey: blob.pathname, url: blob.url, size: bytes.byteLength };
}

export async function uploadCertificatePhoto(file: File) {
  const randomName = nanoid(20);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const pathname = `${CERTIFICATE_PHOTOS_PREFIX}/${randomName}.${ext}`;
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
    token: BLOB_TOKEN
  });
  return {
    storageKey: blob.pathname,
    url: blob.url,
    mimeType: file.type,
    size: file.size,
    originalFilename: file.name
  };
}

export async function blobUrlFromKey(storageKey: string) {
  // With Vercel Blob, the public URL is deterministic from the store's base URL.
  // We resolve it via head() to avoid hard-coding the store hostname.
  const info = await head(storageKey, { token: BLOB_TOKEN });
  return info.url;
}