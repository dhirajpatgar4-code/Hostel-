"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { useToast } from "@/components/ui/toaster";

export const expKeys = {
  list: (pid: string, filters?: any) => ["expenses", pid, filters] as const,
  categories: (pid: string) => ["expense-categories", pid] as const,
  summary: (pid: string, f?: any) => ["expense-summary", pid, f] as const,
  inventory: (pid: string) => ["inventory", pid] as const,
  invTx: (itemId: string) => ["inventory-tx", itemId] as const,
  invSummary: (pid: string) => ["inventory-summary", pid] as const,
};

export function useExpenses(propertyId?: string, filters?: {
  roomId?: string; categoryId?: string; from?: string; to?: string; month?: number; year?: number;
}) {
  return useQuery({
    queryKey: propertyId ? expKeys.list(propertyId, filters) : ["expenses", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listExpenses(propertyId!, filters),
  });
}

export function useCreateExpense(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createExpense>[0]) => api.createExpense(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense-summary"] });
      success("Expense added");
    },
    onError: (e: any) => error("Failed to add expense", e.message),
  });
}

export function useUpdateExpense(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.updateExpense>[1] }) =>
      api.updateExpense(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense-summary"] });
      success("Expense updated");
    },
    onError: (e: any) => error("Failed to update", e.message),
  });
}

export function useDeleteExpense(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense-summary"] });
      success("Expense deleted");
    },
    onError: (e: any) => error("Failed to delete", e.message),
  });
}

export function useExpenseCategories(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? expKeys.categories(propertyId) : ["expense-categories", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listExpenseCategories(propertyId!),
  });
}

export function useCreateExpenseCategory(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createExpenseCategory>[0]) => api.createExpenseCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expKeys.categories(propertyId) });
      success("Category added");
    },
    onError: (e: any) => error("Failed to add category", e.message),
  });
}

export function useDeleteExpenseCategory(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteExpenseCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expKeys.categories(propertyId) });
      success("Category deleted");
    },
    onError: (e: any) => error("Failed to delete category", e.message),
  });
}

export function useExpenseSummary(propertyId?: string, filters?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: propertyId ? expKeys.summary(propertyId, filters) : ["expense-summary", "none"],
    enabled: !!propertyId,
    queryFn: () => api.getExpenseSummary(propertyId!, filters),
  });
}

// Inventory
export function useInventory(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? expKeys.inventory(propertyId) : ["inventory", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listInventory(propertyId!),
  });
}

export function useCreateInventoryItem(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createInventoryItem>[0]) => api.createInventoryItem(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expKeys.inventory(propertyId) });
      qc.invalidateQueries({ queryKey: expKeys.invSummary(propertyId) });
      success("Item added");
    },
    onError: (e: any) => error("Failed to add item", e.message),
  });
}

export function useUpdateInventoryItem(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.updateInventoryItem>[1] }) =>
      api.updateInventoryItem(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expKeys.inventory(propertyId) });
      qc.invalidateQueries({ queryKey: expKeys.invSummary(propertyId) });
      success("Item updated");
    },
    onError: (e: any) => error("Failed to update item", e.message),
  });
}

export function useDeleteInventoryItem(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteInventoryItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expKeys.inventory(propertyId) });
      qc.invalidateQueries({ queryKey: expKeys.invSummary(propertyId) });
      success("Item deleted");
    },
    onError: (e: any) => error("Failed to delete item", e.message),
  });
}

export function useInventoryTransactions(itemId?: string) {
  return useQuery({
    queryKey: itemId ? expKeys.invTx(itemId) : ["inventory-tx", "none"],
    enabled: !!itemId,
    queryFn: () => api.listInventoryTransactions(itemId!),
  });
}

export function useInventorySummary(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? expKeys.invSummary(propertyId) : ["inventory-summary", "none"],
    enabled: !!propertyId,
    queryFn: () => api.getInventorySummary(propertyId!),
  });
}
