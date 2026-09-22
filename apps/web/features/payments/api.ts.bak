import { createClient } from "@/lib/supabase/client";
import type {
  RentRecord, PaymentRecord, DepositRecord, PaymentQR,
  RentRecordWithTenant, PaymentWithRelations, PaymentMethod,
} from "./types";

const sb = () => createClient();

// ─── RENT RECORDS ───────────────────────────────────────────

export async function listRentRecords(
  propertyId: string,
  filters?: { month?: number; year?: number; status?: string; tenantId?: string }
): Promise<RentRecordWithTenant[]> {
  let q = sb()
    .from("rent_records")
    .select(`
      *,
      tenants!inner(full_name, property_id),
      tenant_room_allocations(rooms(room_number))
    `)
    .eq("tenants.property_id", propertyId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (filters?.month) q = q.eq("month", filters.month);
  if (filters?.year) q = q.eq("year", filters.year);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.tenantId) q = q.eq("tenant_id", filters.tenantId);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    ...r,
    tenant_name: r.tenants?.full_name ?? "—",
    room_number: r.tenant_room_allocations?.rooms?.room_number ?? null,
  }));
}

export async function listRentForTenant(tenantId: string): Promise<RentRecord[]> {
  const { data, error } = await sb()
    .from("rent_records")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getRentRecord(id: string): Promise<RentRecord | null> {
  const { data, error } = await sb().from("rent_records").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRentRecord(input: {
  tenant_id: string;
  allocation_id?: string | null;
  month: number;
  year: number;
  rent_amount: number;
  due_date: string;
}): Promise<RentRecord> {
  const { data, error } = await sb().from("rent_records").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateRentRecord(id: string, patch: Partial<RentRecord>): Promise<RentRecord> {
  const { data, error } = await sb().from("rent_records").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRentRecord(id: string): Promise<void> {
  const { error } = await sb().from("rent_records").delete().eq("id", id);
  if (error) throw error;
}

export async function generateMonthlyRent(
  propertyId: string,
  month: number,
  year: number
): Promise<number> {
  const { data: allocs, error: allocErr } = await sb()
    .from("tenant_room_allocations")
    .select(`
      id, tenant_id, allocation_date, rent_amount,
      tenants!inner(property_id)
    `)
    .eq("tenants.property_id", propertyId)
    .eq("status", "active");

  if (allocErr) throw allocErr;
  if (!allocs?.length) return 0;

  const { data: settings } = await sb()
    .from("hostel_settings")
    .select("rent_due_day")
    .eq("property_id", propertyId)
    .maybeSingle();
  const dueDay = settings?.rent_due_day ?? 5;

  const dueDate = `${year}-${String(month).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;

  const rows = (allocs as any[]).map((a) => ({
    tenant_id: a.tenant_id,
    allocation_id: a.id,
    month,
    year,
    rent_amount: a.rent_amount,
    due_date: dueDate,
  }));

  const { error } = await sb()
    .from("rent_records")
    .upsert(rows, { onConflict: "tenant_id,month,year", ignoreDuplicates: true });

  if (error) throw error;
  return rows.length;
}

// ─── PAYMENTS ──────────────────────────────────────────────

export async function listPayments(
  propertyId: string,
  filters?: { from?: string; to?: string; tenantId?: string; month?: number; year?: number }
): Promise<PaymentWithRelations[]> {
  let q = sb()
    .from("payment_records")
    .select(`
      *,
      tenants!inner(full_name, property_id),
      rooms(room_number),
      rent_records(month, year)
    `)
    .eq("tenants.property_id", propertyId)
    .order("payment_date", { ascending: false });

  if (filters?.from) q = q.gte("payment_date", filters.from);
  if (filters?.to) q = q.lte("payment_date", filters.to);
  if (filters?.tenantId) q = q.eq("tenant_id", filters.tenantId);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    ...p,
    tenant_name: p.tenants?.full_name ?? "—",
    room_number: p.rooms?.room_number ?? null,
    month: p.rent_records?.month ?? null,
    year: p.rent_records?.year ?? null,
  }));
}

export async function listPaymentsForTenant(tenantId: string): Promise<PaymentWithRelations[]> {
  const { data, error } = await sb()
    .from("payment_records")
    .select(`
      *,
      tenants!inner(full_name),
      rooms(room_number),
      rent_records(month, year)
    `)
    .eq("tenant_id", tenantId)
    .order("payment_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    ...p,
    tenant_name: p.tenants?.full_name ?? "—",
    room_number: p.rooms?.room_number ?? null,
    month: p.rent_records?.month ?? null,
    year: p.rent_records?.year ?? null,
  }));
}

export async function createPayment(input: {
  tenant_id: string;
  rent_record_id?: string | null;
  room_id?: string | null;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  transaction_ref?: string | null;
  notes?: string | null;
}): Promise<PaymentRecord> {
  const { data, error } = await sb().from("payment_records").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await sb().from("payment_records").delete().eq("id", id);
  if (error) throw error;
}

// ─── DEPOSITS ──────────────────────────────────────────────

export async function listDepositsForTenant(tenantId: string): Promise<DepositRecord[]> {
  const { data, error } = await sb()
    .from("deposit_records")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("received_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDeposit(input: {
  tenant_id: string;
  amount: number;
  received_date: string;
  notes?: string | null;
}): Promise<DepositRecord> {
  const { data, error } = await sb().from("deposit_records").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function refundDeposit(input: {
  id: string;
  refunded_amount: number;
  refunded_date: string;
}): Promise<DepositRecord> {
  const { data, error } = await sb()
    .from("deposit_records")
    .update({ refunded_amount: input.refunded_amount, refunded_date: input.refunded_date })
    .eq("id", input.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── QR CODES ──────────────────────────────────────────────

export async function listQRs(propertyId: string): Promise<PaymentQR[]> {
  const { data, error } = await sb()
    .from("payment_qr_codes")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createQR(input: {
  property_id: string;
  name: string;
  qr_image_url?: string | null;
  upi_id?: string | null;
  description?: string | null;
  is_active?: boolean;
}): Promise<PaymentQR> {
  const { data, error } = await sb().from("payment_qr_codes").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateQR(id: string, patch: Partial<PaymentQR>): Promise<PaymentQR> {
  const { data, error } = await sb().from("payment_qr_codes").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteQR(id: string): Promise<void> {
  const { error } = await sb().from("payment_qr_codes").delete().eq("id", id);
  if (error) throw error;
}

// Upload a QR image file into the public `qr-codes` bucket.
// Returns the public URL to store in payment_qr_codes.qr_image_url
export async function uploadQRImage(propertyId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb()
    .storage.from("qr-codes")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = sb().storage.from("qr-codes").getPublicUrl(path);
  return data.publicUrl;
}

// ─── SUMMARY ───────────────────────────────────────────────

export async function getRevenueSummary(
  propertyId: string,
  filters?: { month?: number; year?: number }
) {
  const now = new Date();
  const month = filters?.month ?? now.getMonth() + 1;
  const year = filters?.year ?? now.getFullYear();

  const { data: rentThisMonth } = await sb()
    .from("rent_records")
    .select("rent_amount, paid_amount, pending_amount, status, tenants!inner(property_id)")
    .eq("tenants.property_id", propertyId)
    .eq("month", month)
    .eq("year", year);

  const rentExpected = (rentThisMonth ?? []).reduce((s, r: any) => s + Number(r.rent_amount), 0);
  const rentCollected = (rentThisMonth ?? []).reduce((s, r: any) => s + Number(r.paid_amount), 0);
  const rentPending = (rentThisMonth ?? []).reduce((s, r: any) => s + Number(r.pending_amount), 0);

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);

  const { data: payments } = await sb()
    .from("payment_records")
    .select("amount, tenants!inner(property_id)")
    .eq("tenants.property_id", propertyId)
    .gte("payment_date", start)
    .lte("payment_date", end);

  const paymentsTotal = (payments ?? []).reduce((s, p: any) => s + Number(p.amount), 0);

  const { data: elecPending } = await sb()
    .from("electricity_bills")
    .select("bill_amount, rooms!inner(property_id)")
    .eq("rooms.property_id", propertyId)
    .in("status", ["pending", "overdue"]);

  const elecTotal = (elecPending ?? []).reduce((s, e: any) => s + Number(e.bill_amount), 0);

  return {
    rentExpected,
    rentCollected,
    rentPending,
    paymentsTotal,
    electricityPending: elecTotal,
    month,
    year,
  };
}
