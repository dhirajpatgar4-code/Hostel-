import { createClient } from "@/lib/supabase/client";
import type { Tenant, TenantAllocation, TenantDocument, TenantWithRoom } from "./types";

const sb = () => createClient();

// ─── TENANTS ────────────────────────────────────────────────

export async function listTenants(propertyId: string): Promise<Tenant[]> {
  const { data, error } = await sb()
    .from("tenants")
    .select("*")
    .eq("property_id", propertyId)
    .eq("archived", false)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listTenantsWithRoom(propertyId: string): Promise<TenantWithRoom[]> {
  const tenants = await listTenants(propertyId);
  if (!tenants.length) return [];

  const tenantIds = tenants.map((t) => t.id);

  const { data: allocs, error: allocErr } = await sb()
    .from("tenant_room_allocations")
    .select("id, tenant_id, room_id, status, rooms(room_number)")
    .in("tenant_id", tenantIds)
    .eq("status", "active");

  if (allocErr) throw allocErr;

  const byTenant = new Map<string, { room_id: string; room_number: string; allocation_id: string }>();
  (allocs ?? []).forEach((a: any) => {
    const roomNumber = a.rooms?.room_number ?? null;
    byTenant.set(a.tenant_id, {
      room_id: a.room_id,
      room_number: roomNumber,
      allocation_id: a.id,
    });
  });

  return tenants.map<TenantWithRoom>((t) => {
    const info = byTenant.get(t.id);
    return {
      ...t,
      current_room_id: info?.room_id ?? null,
      current_room_number: info?.room_number ?? null,
      allocation_id: info?.allocation_id ?? null,
    };
  });
}

export async function getTenant(id: string): Promise<Tenant | null> {
  const { data, error } = await sb().from("tenants").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTenant(
  input: Omit<Tenant, "id" | "created_at" | "updated_at" | "archived">
): Promise<Tenant> {
  const { data, error } = await sb().from("tenants").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTenant(id: string, patch: Partial<Tenant>): Promise<Tenant> {
  const { data, error } = await sb().from("tenants").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function archiveTenant(id: string): Promise<void> {
  const { error } = await sb().from("tenants").update({ archived: true, status: "archived" }).eq("id", id);
  if (error) throw error;
}

// ─── ALLOCATIONS ────────────────────────────────────────────

export async function listAllocationsForTenant(tenantId: string): Promise<TenantAllocation[]> {
  const { data, error } = await sb()
    .from("tenant_room_allocations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("allocation_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listAllocationsForRoom(roomId: string): Promise<TenantAllocation[]> {
  const { data, error } = await sb()
    .from("tenant_room_allocations")
    .select("*")
    .eq("room_id", roomId)
    .order("allocation_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getActiveAllocationForRoom(roomId: string): Promise<TenantAllocation | null> {
  const { data, error } = await sb()
    .from("tenant_room_allocations")
    .select("*")
    .eq("room_id", roomId)
    .eq("status", "active")
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

export async function allocateTenant(input: {
  tenant_id: string;
  room_id: string;
  allocation_date: string;
  rent_amount: number;
  deposit_amount: number;
  notes?: string | null;
}): Promise<TenantAllocation> {
  const { data, error } = await sb()
    .from("tenant_room_allocations")
    .insert({ ...input, status: "active" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deallocateTenant(allocationId: string, deallocationDate: string): Promise<void> {
  const { error } = await sb()
    .from("tenant_room_allocations")
    .update({ status: "completed", deallocation_date: deallocationDate })
    .eq("id", allocationId);
  if (error) throw error;
}

// ─── DOCUMENTS ──────────────────────────────────────────────

export async function listTenantDocuments(tenantId: string): Promise<TenantDocument[]> {
  const { data, error } = await sb()
    .from("tenant_documents")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function uploadTenantDocument(
  propertyId: string,
  tenantId: string,
  file: File,
  docType: string
): Promise<TenantDocument> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${propertyId}/${tenantId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await sb()
    .storage.from("tenant-documents")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  const { data, error } = await sb()
    .from("tenant_documents")
    .insert({
      tenant_id: tenantId,
      doc_type: docType,
      storage_path: path,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTenantDocumentSignedUrl(storagePath: string, expiresIn = 60): Promise<string> {
  const { data, error } = await sb()
    .storage.from("tenant-documents")
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteTenantDocument(doc: TenantDocument): Promise<void> {
  await sb().storage.from("tenant-documents").remove([doc.storage_path]);
  const { error } = await sb().from("tenant_documents").delete().eq("id", doc.id);
  if (error) throw error;
}

// ─── PHOTO (profile) ────────────────────────────────────────

export async function uploadTenantPhoto(
  propertyId: string,
  tenantId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${propertyId}/${tenantId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await sb()
    .storage.from("tenant-profiles")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  // Store the path in the tenant row. Reading uses signed URL.
  const { error: updErr } = await sb()
    .from("tenants")
    .update({ profile_photo_url: path })
    .eq("id", tenantId);
  if (updErr) throw updErr;

  return path;
}

export async function getTenantPhotoSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await sb()
    .storage.from("tenant-profiles")
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// ─── HELPERS ────────────────────────────────────────────────

export function maskAadhaar(value: string | null | undefined): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 12) return value;
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

export function maskPan(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.length !== 10) return value;
  return `${value.slice(0, 2)}XXXXX${value.slice(-3)}`;
}

export function maskPhone(value: string | null | undefined): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value;
  return `XXXXXX${digits.slice(-4)}`;
}