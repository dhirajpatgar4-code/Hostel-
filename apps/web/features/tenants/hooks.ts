"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import type { Tenant, TenantAllocation, TenantDocument } from "./types";
import { useToast } from "@/components/ui/toaster";

export const tenantKeys = {
  all: (pid: string) => ["tenants", pid] as const,
  detail: (id: string) => ["tenant", id] as const,
  allocations: (id: string) => ["tenant-allocations", id] as const,
  docs: (id: string) => ["tenant-docs", id] as const,
  roomAllocations: (roomId: string) => ["room-allocations", roomId] as const,
  activeAlloc: (roomId: string) => ["room-active-alloc", roomId] as const,
};

export function useTenants(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? tenantKeys.all(propertyId) : ["tenants", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listTenantsWithRoom(propertyId!),
  });
}

export function useTenant(id?: string) {
  return useQuery({
    queryKey: id ? tenantKeys.detail(id) : ["tenant", "none"],
    enabled: !!id,
    queryFn: () => api.getTenant(id!),
  });
}

export function useCreateTenant(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Omit<Tenant, "id" | "created_at" | "updated_at" | "archived">) =>
      api.createTenant(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.all(propertyId) });
      success("Tenant added");
    },
    onError: (e: any) => error("Failed to add tenant", e.message),
  });
}

export function useUpdateTenant(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Tenant> }) =>
      api.updateTenant(id, patch),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: tenantKeys.all(propertyId) });
      qc.invalidateQueries({ queryKey: tenantKeys.detail(v.id) });
      success("Tenant updated");
    },
    onError: (e: any) => error("Failed to update tenant", e.message),
  });
}

export function useArchiveTenant(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.archiveTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.all(propertyId) });
      success("Tenant archived");
    },
    onError: (e: any) => error("Failed to archive tenant", e.message),
  });
}

// Allocations
export function useTenantAllocations(tenantId?: string) {
  return useQuery({
    queryKey: tenantId ? tenantKeys.allocations(tenantId) : ["tenant-allocations", "none"],
    enabled: !!tenantId,
    queryFn: () => api.listAllocationsForTenant(tenantId!),
  });
}

export function useRoomAllocations(roomId?: string) {
  return useQuery({
    queryKey: roomId ? tenantKeys.roomAllocations(roomId) : ["room-allocations", "none"],
    enabled: !!roomId,
    queryFn: () => api.listAllocationsForRoom(roomId!),
  });
}

export function useRoomActiveAllocation(roomId?: string) {
  return useQuery({
    queryKey: roomId ? tenantKeys.activeAlloc(roomId) : ["room-active-alloc", "none"],
    enabled: !!roomId,
    queryFn: () => api.getActiveAllocationForRoom(roomId!),
  });
}

export function useAllocateTenant(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.allocateTenant>[0]) => api.allocateTenant(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.all(propertyId) });
      qc.invalidateQueries({ queryKey: ["room-allocations"] });
      qc.invalidateQueries({ queryKey: ["room-active-alloc"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      success("Tenant allocated");
    },
    onError: (e: any) => error("Failed to allocate tenant", e.message),
  });
}

export function useDeallocateTenant(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ allocationId, date }: { allocationId: string; date: string }) =>
      api.deallocateTenant(allocationId, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.all(propertyId) });
      qc.invalidateQueries({ queryKey: ["room-allocations"] });
      qc.invalidateQueries({ queryKey: ["room-active-alloc"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      success("Tenant deallocated");
    },
    onError: (e: any) => error("Failed to deallocate", e.message),
  });
}

// Documents
export function useTenantDocuments(tenantId?: string) {
  return useQuery({
    queryKey: tenantId ? tenantKeys.docs(tenantId) : ["tenant-docs", "none"],
    enabled: !!tenantId,
    queryFn: () => api.listTenantDocuments(tenantId!),
  });
}

export function useUploadTenantDocument(propertyId: string, tenantId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ file, docType }: { file: File; docType: string }) =>
      api.uploadTenantDocument(propertyId, tenantId, file, docType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.docs(tenantId) });
      success("Document uploaded");
    },
    onError: (e: any) => error("Upload failed", e.message),
  });
}

export function useDeleteTenantDocument(tenantId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (doc: TenantDocument) => api.deleteTenantDocument(doc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.docs(tenantId) });
      success("Document deleted");
    },
    onError: (e: any) => error("Failed to delete", e.message),
  });
}

export function useUploadTenantPhoto(propertyId: string, tenantId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (file: File) => api.uploadTenantPhoto(propertyId, tenantId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.detail(tenantId) });
      qc.invalidateQueries({ queryKey: tenantKeys.all(propertyId) });
      success("Photo updated");
    },
    onError: (e: any) => error("Upload failed", e.message),
  });
}