import { createClient } from "@/lib/supabase/client";
import type { Staff, StaffAttendance, SalaryPayment, AttendanceStatus } from "./types";

const sb = () => createClient();

export async function listStaff(propertyId: string): Promise<Staff[]> {
  const { data, error } = await sb()
    .from("staff")
    .select("*")
    .eq("property_id", propertyId)
    .eq("archived", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createStaff(input: Omit<Staff, "id" | "created_at" | "updated_at" | "archived">) {
  const { data, error } = await sb().from("staff").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateStaff(id: string, patch: Partial<Staff>) {
  const { data, error } = await sb().from("staff").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function archiveStaff(id: string) {
  const { error } = await sb().from("staff").update({ archived: true }).eq("id", id);
  if (error) throw error;
}

// ─── ATTENDANCE ────────────────────────────────────────────

export async function listAttendanceForMonth(staffId: string, month: number, year: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const { data, error } = await sb()
    .from("staff_attendance")
    .select("*")
    .eq("staff_id", staffId)
    .gte("attendance_date", start)
    .lte("attendance_date", end);
  if (error) throw error;
  return data ?? [];
}

export async function listAllAttendanceForMonth(propertyId: string, month: number, year: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const { data, error } = await sb()
    .from("staff_attendance")
    .select(`
      *,
      staff!inner(property_id)
    `)
    .eq("staff.property_id", propertyId)
    .gte("attendance_date", start)
    .lte("attendance_date", end);
  if (error) throw error;
  return data ?? [];
}

export async function upsertAttendance(input: {
  staff_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  note?: string | null;
}) {
  const { data, error } = await sb()
    .from("staff_attendance")
    .upsert(input, { onConflict: "staff_id,attendance_date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAttendance(staffId: string, date: string) {
  const { error } = await sb()
    .from("staff_attendance")
    .delete()
    .eq("staff_id", staffId)
    .eq("attendance_date", date);
  if (error) throw error;
}

// ─── SALARY ────────────────────────────────────────────────

export async function listSalary(staffId: string): Promise<SalaryPayment[]> {
  const { data, error } = await sb()
    .from("staff_salary_payments")
    .select("*")
    .eq("staff_id", staffId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function recordSalary(input: {
  staff_id: string;
  month: number;
  year: number;
  present_days: number;
  absent_days: number;
  half_days: number;
  amount: number;
  paid_date?: string | null;
  payment_method?: string | null;
  notes?: string | null;
}) {
  const { data, error } = await sb()
    .from("staff_salary_payments")
    .upsert(input, { onConflict: "staff_id,month,year" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
