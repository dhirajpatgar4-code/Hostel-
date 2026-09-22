import { supabase } from "./supabase";

export async function getMyProperty() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("property_users")
    .select("property_id, role")
    .eq("user_id", user.id)
    .limit(1);

  const m = memberships?.[0];
  if (!m) return null;

  const { data: property } = await supabase
    .from("properties")
    .select("id, name, address, phone, email, logo_url")
    .eq("id", m.property_id)
    .maybeSingle();

  return property ? { property, role: m.role } : null;
}

export async function listRoomsWithOccupancy(propertyId: string) {
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("property_id", propertyId)
    .eq("archived", false)
    .order("room_number");

  if (!rooms?.length) return [];

  const ids = rooms.map((r) => r.id);
  const [{ data: allocs }, { data: imgs }] = await Promise.all([
    supabase.from("tenant_room_allocations").select("room_id").in("room_id", ids).eq("status", "active"),
    supabase.from("room_images").select("room_id, storage_path, is_primary").in("room_id", ids),
  ]);

  const occ = new Map<string, number>();
  (allocs ?? []).forEach((a: any) => occ.set(a.room_id, (occ.get(a.room_id) ?? 0) + 1));

  const imgs_map = new Map<string, string>();
  (imgs ?? []).forEach((i: any) => {
    const ex = imgs_map.get(i.room_id);
    if (!ex || i.is_primary) {
      imgs_map.set(i.room_id, supabase.storage.from("room-images").getPublicUrl(i.storage_path).data.publicUrl);
    }
  });

  return rooms.map((r) => {
    const occupied = occ.get(r.id) ?? 0;
    const status =
      occupied === 0 ? "available" :
      occupied >= r.capacity ? "fully_occupied" : "partially_occupied";
    return { ...r, occupied, status, primary_image_url: imgs_map.get(r.id) ?? null };
  });
}

export async function listTenants(propertyId: string) {
  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .eq("property_id", propertyId)
    .eq("archived", false)
    .order("full_name");

  if (!tenants?.length) return [];
  const ids = tenants.map((t) => t.id);

  const { data: allocs } = await supabase
    .from("tenant_room_allocations")
    .select("tenant_id, room_id, rooms(room_number)")
    .in("tenant_id", ids)
    .eq("status", "active");

  const byTenant = new Map<string, { room_id: string; room_number: string | null }>();
  (allocs ?? []).forEach((a: any) => {
    byTenant.set(a.tenant_id, { room_id: a.room_id, room_number: a.rooms?.room_number ?? null });
  });

  return tenants.map((t) => ({
    ...t,
    current_room_id: byTenant.get(t.id)?.room_id ?? null,
    current_room_number: byTenant.get(t.id)?.room_number ?? null,
  }));
}

export async function listPayments(propertyId: string) {
  const { data } = await supabase
    .from("payment_records")
    .select(`*, tenants!inner(full_name, property_id), rooms(room_number)`)
    .eq("tenants.property_id", propertyId)
    .order("payment_date", { ascending: false })
    .limit(100);
  return (data ?? []).map((p: any) => ({
    ...p,
    tenant_name: p.tenants?.full_name ?? "—",
    room_number: p.rooms?.room_number ?? null,
  }));
}

export async function listElectricity(propertyId: string) {
  const { data } = await supabase
    .from("electricity_bills")
    .select(`*, rooms!inner(room_number, property_id)`)
    .eq("rooms.property_id", propertyId)
    .order("billing_year", { ascending: false })
    .order("billing_month", { ascending: false })
    .limit(200);
  return (data ?? []).map((b: any) => ({
    ...b,
    room_number: b.rooms?.room_number ?? "—",
  }));
}

export async function listExpenses(propertyId: string) {
  const { data } = await supabase
    .from("expenses")
    .select(`*, rooms(room_number), expense_categories(name)`)
    .eq("property_id", propertyId)
    .order("expense_date", { ascending: false })
    .limit(200);
  return (data ?? []).map((e: any) => ({
    ...e,
    room_number: e.rooms?.room_number ?? null,
    category_name: e.expense_categories?.name ?? null,
  }));
}

export async function listTasks(propertyId: string) {
  const { data } = await supabase
    .from("maintenance_tasks")
    .select(`*, rooms(room_number)`)
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []).map((t: any) => ({
    ...t,
    room_number: t.rooms?.room_number ?? null,
  }));
}

export async function listContacts(propertyId: string) {
  const { data } = await supabase
    .from("contacts")
    .select(`*, contact_categories(name)`)
    .eq("property_id", propertyId)
    .order("name");
  return (data ?? []).map((c: any) => ({
    ...c,
    category_name: c.contact_categories?.name ?? null,
  }));
}

export async function getOccupancy(propertyId: string) {
  const { data } = await supabase.rpc("get_occupancy", { p_property: propertyId });
  return data?.[0] ?? {
    total_rooms: 0, occupied_rooms: 0, vacant_rooms: 0,
    total_capacity: 0, occupied_beds: 0, available_beds: 0,
  };
}

export async function getRevenueSummary(propertyId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);

  const [rent, payments] = await Promise.all([
    supabase
      .from("rent_records")
      .select("rent_amount, paid_amount, pending_amount, tenants!inner(property_id)")
      .eq("tenants.property_id", propertyId)
      .eq("month", month)
      .eq("year", year),
    supabase
      .from("payment_records")
      .select("amount, tenants!inner(property_id)")
      .eq("tenants.property_id", propertyId)
      .gte("payment_date", start)
      .lte("payment_date", end),
  ]);

  const rentRows = (rent.data ?? []) as any[];
  const payRows = (payments.data ?? []) as any[];

  return {
    rentExpected: rentRows.reduce((s, r) => s + Number(r.rent_amount), 0),
    rentCollected: rentRows.reduce((s, r) => s + Number(r.paid_amount), 0),
    rentPending: rentRows.reduce((s, r) => s + Number(r.pending_amount), 0),
    paymentsTotal: payRows.reduce((s, p) => s + Number(p.amount), 0),
  };
}
