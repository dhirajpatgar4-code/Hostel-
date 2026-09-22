"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { useToast } from "@/components/ui/toaster";

export const elecKeys = {
  bills: (pid: string, filters?: any) => ["elec-bills", pid, filters] as const,
  billsForRoom: (rid: string) => ["elec-bills-room", rid] as const,
  meter: (rid: string) => ["elec-meter", rid] as const,
  summary: (pid: string, filters?: any) => ["elec-summary", pid, filters] as const,
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: elecKeys.meter(roomId) }); success("Meter saved"); },
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