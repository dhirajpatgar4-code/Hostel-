"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { useToast } from "@/components/ui/toaster";

export const taskKeys = {
  list: (pid: string, f?: any) => ["tasks", pid, f] as const,
  categories: (pid: string) => ["task-categories", pid] as const,
  contacts: (pid: string, f?: any) => ["contacts", pid, f] as const,
  contactCategories: (pid: string) => ["contact-categories", pid] as const,
};

// ─── TASKS ──────────────────────────────────────────────
export function useTasks(propertyId?: string, filters?: {
  roomId?: string; status?: string; categoryId?: string; priority?: string;
}) {
  return useQuery({
    queryKey: propertyId ? taskKeys.list(propertyId, filters) : ["tasks", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listTasks(propertyId!, filters),
  });
}

export function useCreateTask(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createTask>[0]) => api.createTask(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      success("Task created");
    },
    onError: (e: any) => error("Failed to create task", e.message),
  });
}

export function useUpdateTask(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.updateTask>[1] }) =>
      api.updateTask(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      success("Task updated");
    },
    onError: (e: any) => error("Failed to update", e.message),
  });
}

export function useDeleteTask(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      success("Task deleted");
    },
    onError: (e: any) => error("Failed to delete", e.message),
  });
}

export function useCompleteTask(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.completeTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      success("Task completed");
    },
    onError: (e: any) => error("Failed to complete", e.message),
  });
}

export function useTaskCategories(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? taskKeys.categories(propertyId) : ["task-categories", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listTaskCategories(propertyId!),
  });
}

export function useCreateTaskCategory(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createTaskCategory>[0]) => api.createTaskCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.categories(propertyId) });
      success("Category added");
    },
    onError: (e: any) => error("Failed to add category", e.message),
  });
}

export function useDeleteTaskCategory(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteTaskCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.categories(propertyId) });
      success("Category deleted");
    },
    onError: (e: any) => error("Failed to delete category", e.message),
  });
}

// ─── CONTACTS ───────────────────────────────────────────
export function useContacts(propertyId?: string, filters?: { categoryId?: string; search?: string }) {
  return useQuery({
    queryKey: propertyId ? taskKeys.contacts(propertyId, filters) : ["contacts", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listContacts(propertyId!, filters),
  });
}

export function useCreateContact(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createContact>[0]) => api.createContact(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      success("Contact added");
    },
    onError: (e: any) => error("Failed to add contact", e.message),
  });
}

export function useUpdateContact(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.updateContact>[1] }) =>
      api.updateContact(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      success("Contact updated");
    },
    onError: (e: any) => error("Failed to update contact", e.message),
  });
}

export function useDeleteContact(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      success("Contact deleted");
    },
    onError: (e: any) => error("Failed to delete", e.message),
  });
}

export function useContactCategories(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? taskKeys.contactCategories(propertyId) : ["contact-categories", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listContactCategories(propertyId!),
  });
}

export function useCreateContactCategory(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createContactCategory>[0]) => api.createContactCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.contactCategories(propertyId) });
      success("Category added");
    },
    onError: (e: any) => error("Failed to add category", e.message),
  });
}

export function useDeleteContactCategory(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteContactCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.contactCategories(propertyId) });
      success("Category deleted");
    },
    onError: (e: any) => error("Failed to delete category", e.message),
  });
}
