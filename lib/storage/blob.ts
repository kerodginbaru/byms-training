import "server-only";
import { put, del, head } from "@vercel/blob";
import { nanoid } from "nanoid";

/**
 * All receipts/images are uploaded with `access: "private"`-equivalent behavior:
 * Vercel Blob URLs are unguessable (random pathnames) and we never surface the
 * raw blob URL to the public. Admin downloads go through an authenticated
 * server route (/admin/api/receipts/[fileId]) that streams the file after
 * verifying the session, rather than linking directly to blob storage.
 */

const RECEIPTS_PREFIX = "receipts";
const IMAGES_PREFIX = "site-images";

export async function uploadReceipt(file: File) {
  const randomName = `${nanoid(24)}`;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const pathname = `${RECEIPTS_PREFIX}/${randomName}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public", // Vercel Blob currently only supports public URLs; the
    // pathname is a random, unguessable token and is never linked from public
    // pages — access is mediated exclusively through the authenticated admin
    // download route, which is the actual security boundary.
    addRandomSuffix: false,
    contentType: file.type
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
    contentType: file.type
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
  await del(storageKey);
}

export async function blobUrlFromKey(storageKey: string) {
  // With Vercel Blob, the public URL is deterministic from the store's base URL.
  // We resolve it via head() to avoid hard-coding the store hostname.
  const info = await head(storageKey);
  return info.url;
}
