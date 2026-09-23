"use client";
import { createClient } from "@/lib/supabase/client";

export type PhotoMeta = {
  path: string;
  name: string;
  mime: string;
  size: number;
};

const BUCKET = "documents";

/** Upload a File into the `documents` bucket, return metadata. */
export async function uploadPhoto(propertyId: string, scope: string, file: File): Promise<PhotoMeta> {
  const sb = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${propertyId}/${scope}/${crypto.randomUUID()}.${ext}`;

  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  return { path, name: file.name, mime: file.type, size: file.size };
}

/** Delete a photo from storage. */
export async function deletePhoto(path: string): Promise<void> {
  const sb = createClient();
  await sb.storage.from(BUCKET).remove([path]);
}

/** Get a signed URL for a photo. Cached client-side for the session. */
const urlCache = new Map<string, { url: string; expires: number }>();

export async function getPhotoSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const cached = urlCache.get(path);
  if (cached && cached.expires > Date.now() + 60_000) return cached.url;

  const sb = createClient();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;

  urlCache.set(path, { url: data.signedUrl, expires: Date.now() + expiresIn * 1000 });
  return data.signedUrl;
}

/** Validate a file for upload. */
export function validatePhoto(file: File, maxMB = 10): string | null {
  if (!file.type.startsWith("image/")) return "Only image files allowed";
  if (file.size > maxMB * 1024 * 1024) return `Max ${maxMB} MB`;
  return null;
}
