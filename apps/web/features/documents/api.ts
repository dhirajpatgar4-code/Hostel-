import { createClient } from "@/lib/supabase/client";
import type { DocumentFolder, DocumentRecord } from "./types";

const sb = () => createClient();

// ─── FOLDERS ───────────────────────────────────────────────

export async function listFolders(propertyId: string, parentId: string | null = null): Promise<DocumentFolder[]> {
  let q = sb()
    .from("document_folders")
    .select("*")
    .eq("property_id", propertyId)
    .order("name");

  if (parentId === null) q = q.is("parent_id", null);
  else q = q.eq("parent_id", parentId);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listAllFolders(propertyId: string): Promise<DocumentFolder[]> {
  const { data, error } = await sb()
    .from("document_folders")
    .select("*")
    .eq("property_id", propertyId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createFolder(propertyId: string, name: string, parentId: string | null = null) {
  const { data: { user } } = await sb().auth.getUser();
  const { data, error } = await sb()
    .from("document_folders")
    .insert({ property_id: propertyId, name, parent_id: parentId, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameFolder(id: string, name: string) {
  const { error } = await sb().from("document_folders").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteFolder(id: string) {
  const { error } = await sb().from("document_folders").delete().eq("id", id);
  if (error) throw error;
}

// ─── FILES ─────────────────────────────────────────────────

export async function listFiles(
  propertyId: string,
  folderId: string | null = null
): Promise<DocumentRecord[]> {
  let q = sb()
    .from("documents")
    .select("*")
    .eq("property_id", propertyId)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (folderId === null) q = q.is("folder_id", null);
  else q = q.eq("folder_id", folderId);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function searchFiles(propertyId: string, query: string): Promise<DocumentRecord[]> {
  const { data, error } = await sb()
    .from("documents")
    .select("*")
    .eq("property_id", propertyId)
    .eq("archived", false)
    .ilike("search_text", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function uploadFile(input: {
  propertyId: string;
  folderId: string | null;
  file: File;
  title?: string;
  description?: string;
  tags?: string[];
}) {
  const ext = input.file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${input.propertyId}/${input.folderId ?? "root"}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await sb().storage
    .from("documents")
    .upload(path, input.file, { contentType: input.file.type, upsert: false });
  if (upErr) throw upErr;

  const { data: { user } } = await sb().auth.getUser();
  const { data, error } = await sb()
    .from("documents")
    .insert({
      property_id: input.propertyId,
      folder_id: input.folderId,
      title: input.title || input.file.name,
      description: input.description ?? null,
      storage_path: path,
      original_filename: input.file.name,
      mime_type: input.file.type,
      file_size: input.file.size,
      tags: input.tags ?? [],
      uploaded_by: user?.id ?? null,
      category: "other",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFileSignedUrl(storagePath: string, expiresIn = 3600) {
  const { data, error } = await sb().storage
    .from("documents")
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function renameFile(id: string, title: string) {
  const { error } = await sb().from("documents").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function deleteFile(doc: DocumentRecord) {
  await sb().storage.from("documents").remove([doc.storage_path]);
  const { error } = await sb().from("documents").delete().eq("id", doc.id);
  if (error) throw error;
}

export async function moveFile(id: string, folderId: string | null) {
  const { error } = await sb().from("documents").update({ folder_id: folderId }).eq("id", id);
  if (error) throw error;
}

// ─── BREADCRUMB ────────────────────────────────────────────

export async function getFolderPath(folderId: string, propertyId: string): Promise<DocumentFolder[]> {
  const all = await listAllFolders(propertyId);
  const map = new Map(all.map((f) => [f.id, f]));
  const path: DocumentFolder[] = [];
  let cur: string | null = folderId;
  while (cur) {
    const f = map.get(cur);
    if (!f) break;
    path.unshift(f);
    cur = f.parent_id;
  }
  return path;
}
