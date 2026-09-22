import { createClient } from "@/lib/supabase/client";
import type {
  ElectricityBill, ElectricityBillWithRoom, ElectricityMeter, ElectricityBillStatus,
} from "./types";

const sb = () => createClient();

// ─── METERS ────────────────────────────────────────────────

export async function getMeterForRoom(roomId: string): Promise<ElectricityMeter | null> {
  const { data, error } = await sb()
    .from("electricity_meters")
    .select("*")
    .eq("room_id", roomId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

export async function upsertMeter(input: {
  room_id: string;
  consumer_number?: string | null;
  meter_number?: string | null;
  current_reading?: number | null;
  previous_reading?: number | null;
}): Promise<ElectricityMeter> {
  const { data, error } = await sb()
    .from("electricity_meters")
    .upsert(input, { onConflict: "room_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── BILLS ─────────────────────────────────────────────────

export async function listBills(
  propertyId: string,
  filters?: { month?: number; year?: number; roomId?: string; status?: string }
): Promise<ElectricityBillWithRoom[]> {
  let q = sb()
    .from("electricity_bills")
    .select(`
      *,
      rooms!inner(room_number, property_id)
    `)
    .eq("rooms.property_id", propertyId)
    .order("billing_year", { ascending: false })
    .order("billing_month", { ascending: false });

  if (filters?.month) q = q.eq("billing_month", filters.month);
  if (filters?.year) q = q.eq("billing_year", filters.year);
  if (filters?.roomId) q = q.eq("room_id", filters.roomId);
  if (filters?.status) q = q.eq("status", filters.status);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((b: any) => ({
    ...b,
    room_number: b.rooms?.room_number ?? "—",
    property_id: b.rooms?.property_id ?? "",
  }));
}

export async function listBillsForRoom(roomId: string): Promise<ElectricityBill[]> {
  const { data, error } = await sb()
    .from("electricity_bills")
    .select("*")
    .eq("room_id", roomId)
    .order("billing_year", { ascending: false })
    .order("billing_month", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getBill(id: string): Promise<ElectricityBill | null> {
  const { data, error } = await sb().from("electricity_bills").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createBill(input: {
  room_id: string;
  meter_id?: string | null;
  billing_month: number;
  billing_year: number;
  bill_amount: number;
  bill_date?: string | null;
  due_date?: string | null;
  meter_reading?: number | null;
  status?: ElectricityBillStatus;
  notes?: string | null;
}): Promise<ElectricityBill> {
  const { data, error } = await sb().from("electricity_bills").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateBill(id: string, patch: Partial<ElectricityBill>): Promise<ElectricityBill> {
  const { data, error } = await sb().from("electricity_bills").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBill(id: string): Promise<void> {
  const { error } = await sb().from("electricity_bills").delete().eq("id", id);
  if (error) throw error;
}

export async function markBillPaid(id: string): Promise<void> {
  const { error } = await sb().from("electricity_bills").update({ status: "paid" }).eq("id", id);
  if (error) throw error;
}

// ─── BILL PHOTO ────────────────────────────────────────────

export async function uploadBillPhoto(propertyId: string, roomId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${propertyId}/${roomId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await sb()
    .storage.from("electricity-bills")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;
  return path; // store the path; read via signed URL
}

export async function getBillPhotoSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await sb().storage.from("electricity-bills").createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// ─── BULK BILL GENERATION ──────────────────────────────────

export async function generateBillsForMonth(
  propertyId: string,
  month: number,
  year: number
): Promise<number> {
  // Find all rooms in this property that don't yet have a bill for this period.
  const { data: rooms, error: roomErr } = await sb()
    .from("rooms")
    .select("id")
    .eq("property_id", propertyId)
    .eq("archived", false);
  if (roomErr) throw roomErr;
  if (!rooms?.length) return 0;

  const roomIds = rooms.map((r) => r.id);

  const { data: existing, error: existErr } = await sb()
    .from("electricity_bills")
    .select("room_id")
    .in("room_id", roomIds)
    .eq("billing_month", month)
    .eq("billing_year", year);
  if (existErr) throw existErr;

  const existingSet = new Set((existing ?? []).map((e) => e.room_id));
  const toCreate = rooms.filter((r) => !existingSet.has(r.id));

  if (!toCreate.length) return 0;

  const rows = toCreate.map((r) => ({
    room_id: r.id,
    billing_month: month,
    billing_year: year,
    bill_amount: 0,
    status: "photo_pending" as const,
  }));

  const { error } = await sb().from("electricity_bills").insert(rows);
  if (error) throw error;
  return rows.length;
}

// ─── DASHBOARD SUMMARY ─────────────────────────────────────

export async function getElectricitySummary(
  propertyId: string,
  filters?: { month?: number; year?: number }
) {
  const now = new Date();
  const month = filters?.month ?? now.getMonth() + 1;
  const year = filters?.year ?? now.getFullYear();

  const { data: thisMonth } = await sb()
    .from("electricity_bills")
    .select("bill_amount, status, bill_photo_url, rooms!inner(property_id)")
    .eq("rooms.property_id", propertyId)
    .eq("billing_month", month)
    .eq("billing_year", year);

  const rows = thisMonth ?? [];
  const totalBills = rows.reduce((s, b: any) => s + Number(b.bill_amount || 0), 0);
  const totalPaid = rows.filter((b: any) => b.status === "paid").reduce((s, b: any) => s + Number(b.bill_amount || 0), 0);
  const totalPending = rows.filter((b: any) => b.status !== "paid").reduce((s, b: any) => s + Number(b.bill_amount || 0), 0);
  const photoPending = rows.filter((b: any) => !b.bill_photo_url).length;

  // Previous month
  const prevDate = new Date(year, month - 2, 1);
  const prevMonth = prevDate.getMonth() + 1;
  const prevYear = prevDate.getFullYear();

  const { data: prevData } = await sb()
    .from("electricity_bills")
    .select("bill_amount, rooms!inner(property_id)")
    .eq("rooms.property_id", propertyId)
    .eq("billing_month", prevMonth)
    .eq("billing_year", prevYear);

  const prevTotal = (prevData ?? []).reduce((s, b: any) => s + Number(b.bill_amount || 0), 0);

  return {
    totalBills,
    totalPaid,
    totalPending,
    photoPending,
    prevTotal,
    billCount: rows.length,
    month,
    year,
  };
}