import { createClient } from "@/lib/supabase/client";
import type { ReportKind, ReportPayload, ReportRow, ReportFilters } from "./types";

const sb = () => createClient();

// ─── HELPERS ──────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);
}
function monthName(m: number) {
  return new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "long" });
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function getHostel(propertyId: string) {
  const { data } = await sb()
    .from("properties")
    .select("name, address, phone, email, logo_url")
    .eq("id", propertyId)
    .maybeSingle();
  return {
    name: data?.name ?? "Hostel",
    address: data?.address ?? null,
    phone: data?.phone ?? null,
    email: data?.email ?? null,
    logo_url: data?.logo_url ?? null,
  };
}

// ─── REVENUE REPORT ───────────────────────────────────────
async function buildRevenue(propertyId: string, f: ReportFilters): Promise<ReportPayload> {
  const now = new Date();
  const month = f.month ?? now.getMonth() + 1;
  const year = f.year ?? now.getFullYear();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = ymd(new Date(year, month, 0));

  const [rent, payments, expenses, elec, hostel] = await Promise.all([
    sb()
      .from("rent_records")
      .select("rent_amount, paid_amount, pending_amount, status, tenants!inner(property_id)")
      .eq("tenants.property_id", propertyId)
      .eq("month", month)
      .eq("year", year),
    sb()
      .from("payment_records")
      .select("amount, payment_method, tenants!inner(property_id)")
      .eq("tenants.property_id", propertyId)
      .gte("payment_date", start)
      .lte("payment_date", end),
    sb()
      .from("expenses")
      .select("amount, expense_date, expense_categories(name)")
      .eq("property_id", propertyId)
      .gte("expense_date", start)
      .lte("expense_date", end),
    sb()
      .from("electricity_bills")
      .select("bill_amount, status, rooms!inner(property_id)")
      .eq("rooms.property_id", propertyId)
      .eq("billing_month", month)
      .eq("billing_year", year),
    getHostel(propertyId),
  ]);

  const rentRows = (rent.data ?? []) as any[];
  const payRows = (payments.data ?? []) as any[];
  const expRows = (expenses.data ?? []) as any[];
  const elecRows = (elec.data ?? []) as any[];

  const rentExpected = rentRows.reduce((s, r) => s + Number(r.rent_amount), 0);
  const rentCollected = rentRows.reduce((s, r) => s + Number(r.paid_amount), 0);
  const rentPending = rentRows.reduce((s, r) => s + Number(r.pending_amount), 0);

  const elecExpected = elecRows.reduce((s, e) => s + Number(e.bill_amount), 0);
  const elecCollected = elecRows.filter((e) => e.status === "paid").reduce((s, e) => s + Number(e.bill_amount), 0);
  const elecPending = elecExpected - elecCollected;

  const expTotal = expRows.reduce((s, e) => s + Number(e.amount), 0);
  const netCollected = rentCollected + elecCollected - expTotal;

  const rows: ReportRow[] = [
    { metric: "Rent Expected", value: fmt(rentExpected) },
    { metric: "Rent Collected", value: fmt(rentCollected) },
    { metric: "Rent Pending", value: fmt(rentPending) },
    { metric: "Electricity Expected", value: fmt(elecExpected) },
    { metric: "Electricity Collected", value: fmt(elecCollected) },
    { metric: "Electricity Pending", value: fmt(elecPending) },
    { metric: "Total Revenue Collected", value: fmt(rentCollected + elecCollected) },
    { metric: "Total Expenses", value: fmt(expTotal) },
    { metric: "Net Collected Revenue", value: fmt(netCollected) },
  ];

  return {
    kind: "revenue",
    title: "Monthly Revenue Report",
    subtitle: `${monthName(month)} ${year}`,
    summary: [
      { label: "Rent Collected", value: fmt(rentCollected) },
      { label: "Electricity Collected", value: fmt(elecCollected) },
      { label: "Expenses", value: fmt(expTotal) },
      { label: "Net Revenue", value: fmt(netCollected) },
    ],
    columns: [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value", align: "right" },
    ],
    rows,
    hostel,
    generatedAt: new Date().toISOString(),
    period: { month, year },
  };
}

// ─── EXPENSES REPORT ──────────────────────────────────────
async function buildExpenses(propertyId: string, f: ReportFilters): Promise<ReportPayload> {
  const now = new Date();
  const month = f.month ?? now.getMonth() + 1;
  const year = f.year ?? now.getFullYear();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = ymd(new Date(year, month, 0));

  let q = sb()
    .from("expenses")
    .select(`*, rooms(room_number), expense_categories(name)`)
    .eq("property_id", propertyId)
    .gte("expense_date", start)
    .lte("expense_date", end)
    .order("expense_date", { ascending: false });

  if (f.roomId) q = q.eq("room_id", f.roomId);
  if (f.categoryId) q = q.eq("category_id", f.categoryId);

  const [{ data }, hostel] = await Promise.all([q, getHostel(propertyId)]);
  const rows = ((data ?? []) as any[]).map((e) => ({
    date: e.expense_date,
    room: e.rooms?.room_number ?? "Hostel-wide",
    category: e.expense_categories?.name ?? "—",
    description: e.description ?? "—",
    amount: Number(e.amount),
    method: e.payment_method,
    paid_to: e.paid_to ?? "—",
  }));

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  return {
    kind: "expenses",
    title: "Monthly Expense Report",
    subtitle: `${monthName(month)} ${year}`,
    summary: [
      { label: "Total Expenses", value: fmt(total) },
      { label: "Entries", value: rows.length },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "room", label: "Room" },
      { key: "category", label: "Category" },
      { key: "description", label: "Description" },
      { key: "amount", label: "Amount", align: "right" },
      { key: "method", label: "Method" },
      { key: "paid_to", label: "Paid To" },
    ],
    rows,
    hostel,
    generatedAt: new Date().toISOString(),
    period: { month, year },
  };
}

// ─── PAYMENTS REPORT ──────────────────────────────────────
async function buildPayments(propertyId: string, f: ReportFilters): Promise<ReportPayload> {
  const now = new Date();
  const month = f.month ?? now.getMonth() + 1;
  const year = f.year ?? now.getFullYear();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = ymd(new Date(year, month, 0));

  const { data } = await sb()
    .from("payment_records")
    .select(`*, tenants!inner(full_name), rooms(room_number)`)
    .eq("tenants.property_id", propertyId)
    .gte("payment_date", start)
    .lte("payment_date", end)
    .order("payment_date", { ascending: false });

  const hostel = await getHostel(propertyId);

  const rows = ((data ?? []) as any[]).map((p) => ({
    date: p.payment_date,
    tenant: p.tenants?.full_name ?? "—",
    room: p.rooms?.room_number ?? "—",
    amount: Number(p.amount),
    method: p.payment_method,
    reference: p.transaction_ref ?? "—",
    notes: p.notes ?? "",
  }));

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const byMethod: Record<string, number> = {};
  rows.forEach((r) => {
    byMethod[r.method] = (byMethod[r.method] || 0) + Number(r.amount);
  });

  return {
    kind: "payments",
    title: "Monthly Payment Report",
    subtitle: `${monthName(month)} ${year}`,
    summary: [
      { label: "Total Collected", value: fmt(total) },
      { label: "Transactions", value: rows.length },
      { label: "UPI", value: fmt(byMethod["upi"] ?? 0) },
      { label: "Cash", value: fmt(byMethod["cash"] ?? 0) },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "tenant", label: "Tenant" },
      { key: "room", label: "Room" },
      { key: "amount", label: "Amount", align: "right" },
      { key: "method", label: "Method" },
      { key: "reference", label: "Reference" },
    ],
    rows,
    hostel,
    generatedAt: new Date().toISOString(),
    period: { month, year },
  };
}

// ─── RENT REPORT ──────────────────────────────────────────
async function buildRent(propertyId: string, f: ReportFilters): Promise<ReportPayload> {
  const now = new Date();
  const month = f.month ?? now.getMonth() + 1;
  const year = f.year ?? now.getFullYear();

  let q = sb()
    .from("rent_records")
    .select(`*, tenants!inner(full_name, property_id), tenant_room_allocations(rooms(room_number))`)
    .eq("tenants.property_id", propertyId)
    .eq("month", month)
    .eq("year", year);

  if (f.status) q = q.eq("status", f.status);

  const [{ data }, hostel] = await Promise.all([q, getHostel(propertyId)]);

  const rows = ((data ?? []) as any[]).map((r) => ({
    tenant: r.tenants?.full_name ?? "—",
    room: r.tenant_room_allocations?.rooms?.room_number ?? "—",
    rent: Number(r.rent_amount),
    paid: Number(r.paid_amount),
    pending: Number(r.pending_amount),
    due: r.due_date,
    status: r.status,
  }));

  const expected = rows.reduce((s, r) => s + Number(r.rent), 0);
  const paid = rows.reduce((s, r) => s + Number(r.paid), 0);
  const pending = rows.reduce((s, r) => s + Number(r.pending), 0);

  return {
    kind: "rent",
    title: "Monthly Rent Report",
    subtitle: `${monthName(month)} ${year}`,
    summary: [
      { label: "Expected", value: fmt(expected) },
      { label: "Collected", value: fmt(paid) },
      { label: "Pending", value: fmt(pending) },
    ],
    columns: [
      { key: "tenant", label: "Tenant" },
      { key: "room", label: "Room" },
      { key: "rent", label: "Rent", align: "right" },
      { key: "paid", label: "Paid", align: "right" },
      { key: "pending", label: "Pending", align: "right" },
      { key: "due", label: "Due Date" },
      { key: "status", label: "Status" },
    ],
    rows,
    hostel,
    generatedAt: new Date().toISOString(),
    period: { month, year },
  };
}

// ─── ELECTRICITY REPORT ───────────────────────────────────
async function buildElectricity(propertyId: string, f: ReportFilters): Promise<ReportPayload> {
  const now = new Date();
  const month = f.month ?? now.getMonth() + 1;
  const year = f.year ?? now.getFullYear();

  let q = sb()
    .from("electricity_bills")
    .select(`*, rooms!inner(room_number, property_id)`)
    .eq("rooms.property_id", propertyId)
    .eq("billing_month", month)
    .eq("billing_year", year)
    .order("room_id", { ascending: true });

  if (f.status) q = q.eq("status", f.status);

  const [{ data }, hostel] = await Promise.all([q, getHostel(propertyId)]);

  const rows = ((data ?? []) as any[]).map((b) => ({
    room: b.rooms?.room_number ?? "—",
    amount: Number(b.bill_amount),
    reading: b.meter_reading ?? "—",
    bill_date: b.bill_date ?? "—",
    due_date: b.due_date ?? "—",
    photo: b.bill_photo_url ? "Yes" : "No",
    status: b.status,
  }));

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const paid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);

  return {
    kind: "electricity",
    title: "Monthly Electricity Report",
    subtitle: `${monthName(month)} ${year}`,
    summary: [
      { label: "Total Billed", value: fmt(total) },
      { label: "Collected", value: fmt(paid) },
      { label: "Pending", value: fmt(total - paid) },
      { label: "Photos Missing", value: rows.filter((r) => r.photo === "No").length },
    ],
    columns: [
      { key: "room", label: "Room" },
      { key: "amount", label: "Amount", align: "right" },
      { key: "reading", label: "Reading", align: "right" },
      { key: "bill_date", label: "Bill Date" },
      { key: "due_date", label: "Due Date" },
      { key: "photo", label: "Photo" },
      { key: "status", label: "Status" },
    ],
    rows,
    hostel,
    generatedAt: new Date().toISOString(),
    period: { month, year },
  };
}

// ─── OCCUPANCY REPORT ─────────────────────────────────────
async function buildOccupancy(propertyId: string, _f: ReportFilters): Promise<ReportPayload> {
  const [roomsRes, allocRes, hostel] = await Promise.all([
    sb()
      .from("rooms")
      .select("id, room_number, capacity, floor, room_type")
      .eq("property_id", propertyId)
      .eq("archived", false)
      .order("room_number", { ascending: true }),
    sb()
      .from("tenant_room_allocations")
      .select(`room_id, tenants!inner(property_id)`)
      .eq("tenants.property_id", propertyId)
      .eq("status", "active"),
    getHostel(propertyId),
  ]);

  const rooms = (roomsRes.data ?? []) as any[];
  const allocs = (allocRes.data ?? []) as any[];

  const occByRoom = new Map<string, number>();
  allocs.forEach((a) => occByRoom.set(a.room_id, (occByRoom.get(a.room_id) ?? 0) + 1));

  const rows = rooms.map((r) => {
    const occupied = occByRoom.get(r.id) ?? 0;
    const status = occupied === 0 ? "Available" : occupied >= r.capacity ? "Full" : "Partial";
    return {
      room: r.room_number,
      floor: r.floor ?? "—",
      type: r.room_type ?? "—",
      capacity: r.capacity,
      occupied,
      available: Math.max(0, r.capacity - occupied),
      status,
    };
  });

  const totalCap = rows.reduce((s, r) => s + Number(r.capacity), 0);
  const totalOcc = rows.reduce((s, r) => s + Number(r.occupied), 0);
  const pct = totalCap ? Math.round((totalOcc / totalCap) * 100) : 0;

  return {
    kind: "occupancy",
    title: "Occupancy Report",
    subtitle: "Current snapshot",
    summary: [
      { label: "Total Rooms", value: rows.length },
      { label: "Total Beds", value: totalCap },
      { label: "Occupied Beds", value: totalOcc },
      { label: "Occupancy", value: `${pct}%` },
    ],
    columns: [
      { key: "room", label: "Room" },
      { key: "floor", label: "Floor" },
      { key: "type", label: "Type" },
      { key: "capacity", label: "Capacity", align: "right" },
      { key: "occupied", label: "Occupied", align: "right" },
      { key: "available", label: "Available", align: "right" },
      { key: "status", label: "Status" },
    ],
    rows,
    hostel,
    generatedAt: new Date().toISOString(),
    period: null,
  };
}

// ─── TENANTS REPORT ───────────────────────────────────────
async function buildTenants(propertyId: string, _f: ReportFilters): Promise<ReportPayload> {
  const [tenantsRes, allocRes, hostel] = await Promise.all([
    sb()
      .from("tenants")
      .select("id, full_name, phone, monthly_rent, security_deposit, status, created_at")
      .eq("property_id", propertyId)
      .eq("archived", false)
      .order("full_name", { ascending: true }),
    sb()
      .from("tenant_room_allocations")
      .select(`tenant_id, room_id, rooms(room_number), tenants!inner(property_id)`)
      .eq("tenants.property_id", propertyId)
      .eq("status", "active"),
    getHostel(propertyId),
  ]);

  const tenants = (tenantsRes.data ?? []) as any[];
  const allocs = (allocRes.data ?? []) as any[];

  const roomByTenant = new Map<string, string>();
  allocs.forEach((a) => roomByTenant.set(a.tenant_id, a.rooms?.room_number ?? "—"));

  const rows = tenants.map((t) => ({
    name: t.full_name,
    room: roomByTenant.get(t.id) ?? "—",
    phone: t.phone ?? "—",
    rent: Number(t.monthly_rent),
    deposit: Number(t.security_deposit),
    status: t.status,
    joined: t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : "—",
  }));

  const totalRent = rows.reduce((s, r) => s + Number(r.rent), 0);

  return {
    kind: "tenants",
    title: "Tenant Report",
    subtitle: "All active tenants",
    summary: [
      { label: "Total Tenants", value: rows.length },
      { label: "Monthly Rent Sum", value: fmt(totalRent) },
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "room", label: "Room" },
      { key: "phone", label: "Phone" },
      { key: "rent", label: "Rent", align: "right" },
      { key: "deposit", label: "Deposit", align: "right" },
      { key: "status", label: "Status" },
      { key: "joined", label: "Joined" },
    ],
    rows,
    hostel,
    generatedAt: new Date().toISOString(),
    period: null,
  };
}

// ─── ROOMS REPORT ─────────────────────────────────────────
async function buildRooms(propertyId: string, _f: ReportFilters): Promise<ReportPayload> {
  const [roomsRes, allocRes, hostel] = await Promise.all([
    sb()
      .from("rooms")
      .select("id, room_number, capacity, floor, room_type, archived")
      .eq("property_id", propertyId)
      .order("room_number", { ascending: true }),
    sb()
      .from("tenant_room_allocations")
      .select(`room_id, tenants!inner(property_id)`)
      .eq("tenants.property_id", propertyId)
      .eq("status", "active"),
    getHostel(propertyId),
  ]);

  const rooms = (roomsRes.data ?? []) as any[];
  const allocs = (allocRes.data ?? []) as any[];

  const occByRoom = new Map<string, number>();
  allocs.forEach((a) => occByRoom.set(a.room_id, (occByRoom.get(a.room_id) ?? 0) + 1));

  const rows = rooms.map((r) => {
    const occ = occByRoom.get(r.id) ?? 0;
    return {
      room: r.room_number,
      type: r.room_type ?? "—",
      floor: r.floor ?? "—",
      capacity: r.capacity,
      occupied: occ,
      status: r.archived ? "Archived" : occ === 0 ? "Available" : occ >= r.capacity ? "Full" : "Partial",
    };
  });

  return {
    kind: "rooms",
    title: "Room Report",
    subtitle: "All rooms with occupancy",
    summary: [
      { label: "Total Rooms", value: rows.length },
      { label: "Total Beds", value: rows.reduce((s, r) => s + Number(r.capacity), 0) },
    ],
    columns: [
      { key: "room", label: "Room" },
      { key: "type", label: "Type" },
      { key: "floor", label: "Floor" },
      { key: "capacity", label: "Capacity", align: "right" },
      { key: "occupied", label: "Occupied", align: "right" },
      { key: "status", label: "Status" },
    ],
    rows,
    hostel,
    generatedAt: new Date().toISOString(),
    period: null,
  };
}

// ─── PUBLIC BUILDER ───────────────────────────────────────
export async function buildReport(
  kind: ReportKind,
  propertyId: string,
  filters: ReportFilters
): Promise<ReportPayload> {
  switch (kind) {
    case "revenue": return buildRevenue(propertyId, filters);
    case "expenses": return buildExpenses(propertyId, filters);
    case "payments": return buildPayments(propertyId, filters);
    case "rent": return buildRent(propertyId, filters);
    case "electricity": return buildElectricity(propertyId, filters);
    case "occupancy": return buildOccupancy(propertyId, filters);
    case "tenants": return buildTenants(propertyId, filters);
    case "rooms": return buildRooms(propertyId, filters);
    default: throw new Error("Unknown report kind");
  }
}
