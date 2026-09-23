import { createClient } from "@/lib/supabase/client";
import type { RoomFolder, RoomDocument } from "./types";

const sb = () => createClient();

export async function listRoomFolders(roomId: string, parentId: string | null = null): Promise<RoomFolder[]> {
  let q = sb()
    .from("room_document_folders")
    .select("*")
    .eq("room_id", roomId)
    .order("name");
  if (parentId === null) q = q.is("parent_id", null);
  else q = q.eq("parent_id", parentId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listAllRoomFolders(roomId: string): Promise<RoomFolder[]> {
  const { data, error } = await sb()
    .from("room_document_folders")
    .select("*")
    .eq("room_id", roomId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createRoomFolder(propertyId: string, roomId: string, name: string, parentId: string | null) {
  const { data: { user } } = await sb().auth.getUser();
  const { data, error } = await sb()
    .from("room_document_folders")
    .insert({
      property_id: propertyId,
      room_id: roomId,
      parent_id: parentId,
      name,
      created_by: user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameRoomFolder(id: string, name: string) {
  const { error } = await sb().from("room_document_folders").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteRoomFolder(id: string) {
  const { error } = await sb().from("room_document_folders").delete().eq("id", id);
  if (error) throw error;
}

// ─── FILES ──────────────────────────────────────────────

export async function listRoomFiles(roomId: string, folderId: string | null = null): Promise<RoomDocument[]> {
  let q = sb()
    .from("documents")
    .select("*")
    .eq("room_id", roomId)
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (folderId === null) q = q.is("room_folder_id", null);
  else q = q.eq("room_folder_id", folderId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function searchRoomFiles(roomId: string, query: string): Promise<RoomDocument[]> {
  const { data, error } = await sb()
    .from("documents")
    .select("*")
    .eq("room_id", roomId)
    .eq("archived", false)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,original_filename.ilike.%${query}%`)
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function uploadRoomFile(input: {
  propertyId: string;
  roomId: string;
  folderId: string | null;
  file: File;
  title?: string;
  description?: string;
}) {
  const ext = input.file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${input.propertyId}/room-${input.roomId}/${input.folderId ?? "root"}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await sb()
    .storage.from("documents")
    .upload(path, input.file, { contentType: input.file.type, upsert: false });
  if (upErr) throw upErr;

  const { data: { user } } = await sb().auth.getUser();
  const { data, error } = await sb()
    .from("documents")
    .insert({
      property_id: input.propertyId,
      room_id: input.roomId,
      room_folder_id: input.folderId,
      folder_id: null,
      title: input.title || input.file.name,
      description: input.description ?? null,
      storage_path: path,
      original_filename: input.file.name,
      mime_type: input.file.type,
      file_size: input.file.size,
      tags: [],
      uploaded_by: user?.id ?? null,
      category: "other",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getRoomFileSignedUrl(storagePath: string, expiresIn = 3600) {
  const { data, error } = await sb().storage.from("documents").createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function renameRoomFile(id: string, title: string) {
  const { error } = await sb().from("documents").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function deleteRoomFile(doc: RoomDocument) {
  await sb().storage.from("documents").remove([doc.storage_path]);
  const { error } = await sb().from("documents").delete().eq("id", doc.id);
  if (error) throw error;
}

export async function getRoomFolderPath(folderId: string, roomId: string): Promise<RoomFolder[]> {
  const all = await listAllRoomFolders(roomId);
  const map = new Map(all.map((f) => [f.id, f]));
  const path: RoomFolder[] = [];
  let cur: string | null = folderId;
  while (cur) {
    const f = map.get(cur);
    if (!f) break;
    path.unshift(f);
    cur = f.parent_id;
  }
  return path;
}
