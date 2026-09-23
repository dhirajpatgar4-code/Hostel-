"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { useToast } from "@/components/ui/toaster";

export const elecKeys = {
  bills: (pid: string, filters?: any) => ["elec-bills", pid, filters] as const,
  billsForRoom: (rid: string) => ["elec-bills-room", rid] as const,
  meter: (rid: string) => ["elec-meter", rid] as const,
  summary: (pid: string, filters?: any) => ["elec-summary", pid, filters] as const,
  buildingBill: (pid: string, m: number, y: number) => ["building-bill", pid, m, y] as const,
  comparison: (pid: string, m: number, y: number) => ["elec-comparison", pid, m, y] as const,
};

export function useBills(propertyId?: string, filters?: {
  month?: number; year?: number; roomId?: string; status?: string;
}) {
  return useQuery({
    queryKey: propertyId ? elecKeys.bills(propertyId, filters) : ["elec-bills", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listBills(propertyId!, filters),
  });
}

export function useBillsForRoom(roomId?: string) {
  return useQuery({
    queryKey: roomId ? elecKeys.billsForRoom(roomId) : ["elec-bills-room", "none"],
    enabled: !!roomId,
    queryFn: () => api.listBillsForRoom(roomId!),
  });
}

export function useMeter(roomId?: string) {
  return useQuery({
    queryKey: roomId ? elecKeys.meter(roomId) : ["elec-meter", "none"],
    enabled: !!roomId,
    queryFn: () => api.getMeterForRoom(roomId!),
  });
}

export function useUpsertMeter(roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.upsertMeter>[0]) => api.upsertMeter(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: elecKeys.meter(roomId) });
      success("Meter saved");
    },
    onError: (e: any) => error("Failed to save meter", e.message),
  });
}

export function useCreateBill(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createBill>[0]) => api.createBill(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["elec-bills"] });
      qc.invalidateQueries({ queryKey: ["elec-summary"] });
      qc.invalidateQueries({ queryKey: ["elec-comparison"] });
      success("Bill added");
    },
    onError: (e: any) => error("Failed to add bill", e.message),
  });
}

export function useUpdateBill(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.updateBill>[1] }) =>
      api.updateBill(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["elec-bills"] });
      qc.invalidateQueries({ queryKey: ["elec-bills-room"] });
      qc.invalidateQueries({ queryKey: ["elec-summary"] });
      qc.invalidateQueries({ queryKey: ["elec-comparison"] });
      success("Bill updated");
    },
    onError: (e: any) => error("Failed to update bill", e.message),
  });
}

export function useDeleteBill(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteBill(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["elec-bills"] });
      qc.invalidateQueries({ queryKey: ["elec-summary"] });
      qc.invalidateQueries({ queryKey: ["elec-comparison"] });
      success("Bill deleted");
    },
    onError: (e: any) => error("Failed to delete", e.message),
  });
}

export function useMarkBillPaid(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.markBillPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["elec-bills"] });
      qc.invalidateQueries({ queryKey: ["elec-bills-room"] });
      qc.invalidateQueries({ queryKey: ["elec-summary"] });
      qc.invalidateQueries({ queryKey: ["elec-comparison"] });
      success("Marked as paid");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useGenerateBills(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      api.generateBillsForMonth(propertyId, month, year),
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["elec-bills"] });
      qc.invalidateQueries({ queryKey: ["elec-summary"] });
      qc.invalidateQueries({ queryKey: ["elec-comparison"] });
      success(`Generated ${n} bill placeholder(s)`);
    },
    onError: (e: any) => error("Failed to generate", e.message),
  });
}

export function useElectricitySummary(propertyId?: string, filters?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: propertyId ? elecKeys.summary(propertyId, filters) : ["elec-summary", "none"],
    enabled: !!propertyId,
    queryFn: () => api.getElectricitySummary(propertyId!, filters),
  });
}

export function useUploadBillPhoto(propertyId: string, roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (file: File) => api.uploadBillPhoto(propertyId, roomId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["elec-bills"] });
      qc.invalidateQueries({ queryKey: ["elec-bills-room"] });
      success("Photo uploaded");
    },
    onError: (e: any) => error("Upload failed", e.message),
  });
}

// ─── BUILDING BILLS ───────────────────────────────────────

export function useBuildingBill(propertyId?: string, month?: number, year?: number) {
  return useQuery({
    queryKey:
      propertyId && month && year
        ? elecKeys.buildingBill(propertyId, month, year)
        : (["building-bill", "none"] as const),
    enabled: !!propertyId && !!month && !!year,
    queryFn: () => api.getBuildingBill(propertyId!, month!, year!),
  });
}

export function useElectricityComparison(propertyId?: string, month?: number, year?: number) {
  return useQuery({
    queryKey:
      propertyId && month && year
        ? elecKeys.comparison(propertyId, month, year)
        : (["elec-comparison", "none"] as const),
    enabled: !!propertyId && !!month && !!year,
    queryFn: () => api.getElectricityComparison(propertyId!, month!, year!),
  });
}

export function useUpsertBuildingBill(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.upsertBuildingBill>[0]) =>
      api.upsertBuildingBill(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["building-bill"] });
      qc.invalidateQueries({ queryKey: ["elec-comparison"] });
      success("Building bill saved");
    },
    onError: (e: any) => error("Failed to save", e.message),
  });
}

export function useUploadBuildingBillPhoto(propertyId: string, month: number, year: number) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (file: File) => api.uploadBuildingBillPhoto(propertyId, month, year, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["building-bill"] });
      success("Photo uploaded");
    },
    onError: (e: any) => error("Upload failed", e.message),
  });
}
