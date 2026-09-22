import { createClient } from "@/lib/supabase/client";
import type { Task, TaskCategory, TaskWithRelations } from "./types";

const sb = () => createClient();

export async function listTasks(
  propertyId: string,
  filters?: { roomId?: string; status?: string; categoryId?: string; priority?: string }
): Promise<TaskWithRelations[]> {
  let q = sb()
    .from("maintenance_tasks")
    .select(`*, rooms(room_number), maintenance_categories(name)`)
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (filters?.roomId) q = q.eq("room_id", filters.roomId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters?.priority) q = q.eq("priority", filters.priority);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((t: any) => ({
    ...t,
    room_number: t.rooms?.room_number ?? null,
    category_name: t.maintenance_categories?.name ?? null,
  }));
}

export async function createTask(input: {
  property_id: string;
  room_id?: string | null;
  category_id?: string | null;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  due_date?: string | null;
  reminder_date?: string | null;
  assigned_to?: string | null;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string | null;
}): Promise<Task> {
  const { data, error } = await sb().from("maintenance_tasks").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  const { data, error } = await sb().from("maintenance_tasks").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await sb().from("maintenance_tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function completeTask(id: string): Promise<void> {
  const { error } = await sb()
    .from("maintenance_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function listTaskCategories(propertyId: string): Promise<TaskCategory[]> {
  const { data, error } = await sb()
    .from("maintenance_categories")
    .select("*")
    .eq("property_id", propertyId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTaskCategory(input: { property_id: string; name: string }): Promise<TaskCategory> {
  const { data, error } = await sb().from("maintenance_categories").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTaskCategory(id: string): Promise<void> {
  const { error } = await sb().from("maintenance_categories").delete().eq("id", id);
  if (error) throw error;
}

// ─── CONTACTS ────────────────────────────────────────────

export type Contact = {
  id: string;
  property_id: string;
  category_id: string | null;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactCategory = {
  id: string;
  property_id: string;
  name: string;
  is_system: boolean;
  created_at: string;
};

export type ContactWithCategory = Contact & { category_name: string | null };

export async function listContacts(
  propertyId: string,
  filters?: { categoryId?: string; search?: string }
): Promise<ContactWithCategory[]> {
  let q = sb()
    .from("contacts")
    .select(`*, contact_categories(name)`)
    .eq("property_id", propertyId)
    .order("name", { ascending: true });

  if (filters?.categoryId) q = q.eq("category_id", filters.categoryId);

  const { data, error } = await q;
  if (error) throw error;

  let rows = (data ?? []).map((c: any) => ({
    ...c,
    category_name: c.contact_categories?.name ?? null,
  }));

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.phone ?? "").toLowerCase().includes(s) ||
        (c.whatsapp ?? "").toLowerCase().includes(s)
    );
  }

  return rows;
}

export async function createContact(input: {
  property_id: string;
  category_id?: string | null;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  notes?: string | null;
}): Promise<Contact> {
  const { data, error } = await sb().from("contacts").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateContact(id: string, patch: Partial<Contact>): Promise<Contact> {
  const { data, error } = await sb().from("contacts").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await sb().from("contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function listContactCategories(propertyId: string): Promise<ContactCategory[]> {
  const { data, error } = await sb()
    .from("contact_categories")
    .select("*")
    .eq("property_id", propertyId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createContactCategory(input: { property_id: string; name: string }): Promise<ContactCategory> {
  const { data, error } = await sb()
    .from("contact_categories")
    .insert({ ...input, is_system: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContactCategory(id: string): Promise<void> {
  const { error } = await sb().from("contact_categories").delete().eq("id", id);
  if (error) throw error;
}
