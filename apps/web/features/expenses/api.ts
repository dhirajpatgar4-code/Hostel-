import { createClient } from "@/lib/supabase/client";
import type {
  Expense, ExpenseCategory, ExpenseWithRelations,
  InventoryItem, InventoryTransaction, InventoryItemWithRoom,
} from "./types";

const sb = () => createClient();

// ─── EXPENSES ──────────────────────────────────────────────

export async function listExpenses(
  propertyId: string,
  filters?: { roomId?: string; categoryId?: string; from?: string; to?: string; month?: number; year?: number }
): Promise<ExpenseWithRelations[]> {
  let q = sb()
    .from("expenses")
    .select(`*, rooms(room_number), expense_categories(name)`)
    .eq("property_id", propertyId)
    .order("expense_date", { ascending: false });

  if (filters?.roomId) q = q.eq("room_id", filters.roomId);
  if (filters?.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters?.from) q = q.gte("expense_date", filters.from);
  if (filters?.to) q = q.lte("expense_date", filters.to);

  if (filters?.month && filters?.year) {
    const start = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
    const end = new Date(filters.year, filters.month, 0).toISOString().slice(0, 10);
    q = q.gte("expense_date", start).lte("expense_date", end);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((e: any) => ({
    ...e,
    room_number: e.rooms?.room_number ?? null,
    category_name: e.expense_categories?.name ?? null,
  }));
}

export async function createExpense(input: {
  property_id: string;
  room_id?: string | null;
  category_id?: string | null;
  description?: string | null;
  amount: number;
  expense_date: string;
  payment_method: "cash" | "upi" | "bank_transfer" | "card" | "other";
  paid_to?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
}): Promise<Expense> {
  const { data, error } = await sb().from("expenses").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateExpense(id: string, patch: Partial<Expense>): Promise<Expense> {
  const { data, error } = await sb().from("expenses").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await sb().from("expenses").delete().eq("id", id);
  if (error) throw error;
}

// ─── CATEGORIES ────────────────────────────────────────────

export async function listExpenseCategories(propertyId: string): Promise<ExpenseCategory[]> {
  const { data, error } = await sb()
    .from("expense_categories")
    .select("*")
    .eq("property_id", propertyId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createExpenseCategory(input: {
  property_id: string;
  name: string;
}): Promise<ExpenseCategory> {
  const { data, error } = await sb()
    .from("expense_categories")
    .insert({ ...input, is_system: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  const { error } = await sb().from("expense_categories").delete().eq("id", id);
  if (error) throw error;
}

// ─── SUMMARY ───────────────────────────────────────────────

export async function getExpenseSummary(propertyId: string, filters?: { month?: number; year?: number }) {
  const now = new Date();
  const month = filters?.month ?? now.getMonth() + 1;
  const year = filters?.year ?? now.getFullYear();

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);

  const { data } = await sb()
    .from("expenses")
    .select("amount, category_id, expense_categories(name)")
    .eq("property_id", propertyId)
    .gte("expense_date", start)
    .lte("expense_date", end);

  const rows = (data ?? []) as any[];
  const total = rows.reduce((s, e) => s + Number(e.amount || 0), 0);

  const byCategory: Record<string, number> = {};
  rows.forEach((r) => {
    const name = r.expense_categories?.name ?? "Uncategorized";
    byCategory[name] = (byCategory[name] || 0) + Number(r.amount || 0);
  });

  return { total, byCategory, month, year };
}

// ─── INVENTORY ─────────────────────────────────────────────

export async function listInventory(propertyId: string): Promise<InventoryItemWithRoom[]> {
  const { data, error } = await sb()
    .from("inventory_items")
    .select(`*, rooms(room_number)`)
    .eq("property_id", propertyId)
    .order("item_type", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((i: any) => ({
    ...i,
    room_number: i.rooms?.room_number ?? null,
  }));
}

export async function createInventoryItem(input: {
  property_id: string;
  item_type: string;
  identifier?: string | null;
  condition: "Good" | "Fair" | "Poor" | "Broken";
  status: "available" | "allocated" | "broken" | "retired";
  room_id?: string | null;
}): Promise<InventoryItem> {
  const { data, error } = await sb().from("inventory_items").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateInventoryItem(id: string, patch: Partial<InventoryItem>): Promise<InventoryItem> {
  const { data, error } = await sb().from("inventory_items").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { error } = await sb().from("inventory_items").delete().eq("id", id);
  if (error) throw error;
}

export async function listInventoryTransactions(itemId: string): Promise<InventoryTransaction[]> {
  const { data, error } = await sb()
    .from("inventory_transactions")
    .select("*")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getInventorySummary(propertyId: string) {
  const { data } = await sb()
    .from("inventory_items")
    .select("status, condition")
    .eq("property_id", propertyId);

  const rows = (data ?? []) as any[];
  return {
    total: rows.length,
    available: rows.filter((r) => r.status === "available").length,
    allocated: rows.filter((r) => r.status === "allocated").length,
    broken: rows.filter((r) => r.status === "broken" || r.condition === "Broken").length,
    retired: rows.filter((r) => r.status === "retired").length,
  };
}
