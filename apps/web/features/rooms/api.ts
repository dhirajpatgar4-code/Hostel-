import { createClient } from "@/lib/supabase/client";
import type { Room, RoomAsset, RoomImage, RoomWithOccupancy } from "./types";

const supabase = () => createClient();

// ─── ROOMS ────────────────────────────────────────────────

export async function listRooms(propertyId: string): Promise<Room[]> {
  const { data, error } = await supabase()
    .from("rooms")
    .select("*")
    .eq("property_id", propertyId)
    .eq("archived", false)
    .order("room_number", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getRoom(id: string): Promise<Room | null> {
  const { data, error } = await supabase().from("rooms").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listRoomsWithOccupancy(propertyId: string): Promise<RoomWithOccupancy[]> {
  const rooms = await listRooms(propertyId);
  if (!rooms.length) return [];

  const roomIds = rooms.map((r) => r.id);

  const [{ data: allocs }, { data: imgs }] = await Promise.all([
    supabase()
      .from("tenant_room_allocations")
      .select("room_id")
      .in("room_id", roomIds)
      .eq("status", "active"),
    supabase()
      .from("room_images")
      .select("room_id, storage_path, is_primary")
      .in("room_id", roomIds),
  ]);

  const occupiedByRoom = new Map<string, number>();
  (allocs ?? []).forEach((a: any) => {
    occupiedByRoom.set(a.room_id, (occupiedByRoom.get(a.room_id) ?? 0) + 1);
  });

  const primaryImage = new Map<string, string>();
  (imgs ?? []).forEach((img: any) => {
    const existing = primaryImage.get(img.room_id);
    if (!existing || img.is_primary) {
      primaryImage.set(img.room_id, publicUrl("room-images", img.storage_path));
    }
  });

  return rooms.map<RoomWithOccupancy>((r) => {
    const occupied = occupiedByRoom.get(r.id) ?? 0;
    let status: RoomWithOccupancy["status"] = "available";
    if (occupied === 0) status = "available";
    else if (occupied >= r.capacity) status = "fully_occupied";
    else status = "partially_occupied";

    return {
      ...r,
      occupied,
      status,
      primary_image_url: primaryImage.get(r.id) ?? null,
    };
  });
}

export async function createRoom(input: Omit<Room, "id" | "created_at" | "updated_at" | "archived">): Promise<Room> {
  const { data, error } = await supabase().from("rooms").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateRoom(id: string, patch: Partial<Room>): Promise<Room> {
  const { data, error } = await supabase().from("rooms").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function archiveRoom(id: string): Promise<void> {
  const { error } = await supabase().from("rooms").update({ archived: true }).eq("id", id);
  if (error) throw error;
}

// ─── ASSETS ──────────────────────────────────────────────

export async function listRoomAssets(roomId: string): Promise<RoomAsset[]> {
  const { data, error } = await supabase()
    .from("room_assets")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRoomAsset(input: Omit<RoomAsset, "id" | "created_at" | "updated_at" | "photo_url"> & { photo_url?: string | null }): Promise<RoomAsset> {
  const { data, error } = await supabase().from("room_assets").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateRoomAsset(id: string, patch: Partial<RoomAsset>): Promise<RoomAsset> {
  const { data, error } = await supabase().from("room_assets").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRoomAsset(id: string): Promise<void> {
  const { error } = await supabase().from("room_assets").delete().eq("id", id);
  if (error) throw error;
}

// ─── IMAGES ─────────────────────────────────────────────

export function publicUrl(bucket: string, path: string): string {
  return supabase().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function listRoomImages(roomId: string): Promise<RoomImage[]> {
  const { data, error } = await supabase()
    .from("room_images")
    .select("*")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function uploadRoomImage(propertyId: string, roomId: string, file: File): Promise<RoomImage> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${propertyId}/${roomId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase().storage.from("room-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data, error } = await supabase()
    .from("room_images")
    .insert({
      room_id: roomId,
      storage_path: path,
      original_filename: file.name,
      is_primary: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRoomImage(image: RoomImage): Promise<void> {
  await supabase().storage.from("room-images").remove([image.storage_path]);
  const { error } = await supabase().from("room_images").delete().eq("id", image.id);
  if (error) throw error;
}

export async function setPrimaryRoomImage(roomId: string, imageId: string): Promise<void> {
  await supabase().from("room_images").update({ is_primary: false }).eq("room_id", roomId);
  const { error } = await supabase().from("room_images").update({ is_primary: true }).eq("id", imageId);
  if (error) throw error;
}