"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { useToast } from "@/components/ui/toaster";

export const payKeys = {
  rents: (pid: string, filters?: any) => ["rents", pid, filters] as const,
  rentsForTenant: (tid: string) => ["rents-tenant", tid] as const,
  payments: (pid: string, filters?: any) => ["payments", pid, filters] as const,
  paymentsForTenant: (tid: string) => ["payments-tenant", tid] as const,
  deposits: (tid: string) => ["deposits", tid] as const,
  qrs: (pid: string) => ["qrs", pid] as const,
  summary: (pid: string, f?: any) => ["revenue-summary", pid, f] as const,
};

export function useRentRecords(propertyId?: string, filters?: {
  month?: number; year?: number; status?: string; tenantId?: string;
}) {
  return useQuery({
    queryKey: propertyId ? payKeys.rents(propertyId, filters) : ["rents", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listRentRecords(propertyId!, filters),
  });
}

export function useRentForTenant(tenantId?: string) {
  return useQuery({
    queryKey: tenantId ? payKeys.rentsForTenant(tenantId) : ["rents-tenant", "none"],
    enabled: !!tenantId,
    queryFn: () => api.listRentForTenant(tenantId!),
  });
}

export function useGenerateMonthlyRent(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      api.generateMonthlyRent(propertyId, month, year),
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["rents"] });
      qc.invalidateQueries({ queryKey: ["revenue-summary"] });
      success(`Generated ${count} rent record(s)`);
    },
    onError: (e: any) => error("Failed to generate rent", e.message),
  });
}

export function useCreateRentRecord(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createRentRecord>[0]) => api.createRentRecord(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rents"] });
      qc.invalidateQueries({ queryKey: ["revenue-summary"] });
      success("Rent record created");
    },
    onError: (e: any) => error("Failed to create rent", e.message),
  });
}

export function useUpdateRentRecord(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.updateRentRecord>[1] }) =>
      api.updateRentRecord(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rents"] });
      qc.invalidateQueries({ queryKey: ["revenue-summary"] });
      success("Rent updated");
    },
    onError: (e: any) => error("Failed to update rent", e.message),
  });
}

export function useDeleteRentRecord(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteRentRecord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rents"] });
      qc.invalidateQueries({ queryKey: ["revenue-summary"] });
      success("Rent record deleted");
    },
    onError: (e: any) => error("Failed to delete rent", e.message),
  });
}

// Payments
export function usePayments(propertyId?: string, filters?: {
  from?: string; to?: string; tenantId?: string; month?: number; year?: number;
}) {
  return useQuery({
    queryKey: propertyId ? payKeys.payments(propertyId, filters) : ["payments", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listPayments(propertyId!, filters),
  });
}

export function usePaymentsForTenant(tenantId?: string) {
  return useQuery({
    queryKey: tenantId ? payKeys.paymentsForTenant(tenantId) : ["payments-tenant", "none"],
    enabled: !!tenantId,
    queryFn: () => api.listPaymentsForTenant(tenantId!),
  });
}

export function useCreatePayment(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createPayment>[0]) => api.createPayment(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payments-tenant"] });
      qc.invalidateQueries({ queryKey: ["rents"] });
      qc.invalidateQueries({ queryKey: ["rents-tenant"] });
      qc.invalidateQueries({ queryKey: ["revenue-summary"] });
      success("Payment recorded");
    },
    onError: (e: any) => error("Failed to record payment", e.message),
  });
}

export function useDeletePayment(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payments-tenant"] });
      qc.invalidateQueries({ queryKey: ["rents"] });
      qc.invalidateQueries({ queryKey: ["revenue-summary"] });
      success("Payment deleted");
    },
    onError: (e: any) => error("Failed to delete payment", e.message),
  });
}

// Deposits
export function useDepositsForTenant(tenantId?: string) {
  return useQuery({
    queryKey: tenantId ? payKeys.deposits(tenantId) : ["deposits", "none"],
    enabled: !!tenantId,
    queryFn: () => api.listDepositsForTenant(tenantId!),
  });
}

export function useCreateDeposit(tenantId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createDeposit>[0]) => api.createDeposit(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payKeys.deposits(tenantId) });
      success("Deposit recorded");
    },
    onError: (e: any) => error("Failed to record deposit", e.message),
  });
}

export function useRefundDeposit(tenantId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.refundDeposit>[0]) => api.refundDeposit(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payKeys.deposits(tenantId) });
      success("Deposit refunded");
    },
    onError: (e: any) => error("Failed to refund", e.message),
  });
}

// QR codes
export function useQRs(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? payKeys.qrs(propertyId) : ["qrs", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listQRs(propertyId!),
  });
}

export function useCreateQR(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createQR>[0]) => api.createQR(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payKeys.qrs(propertyId) });
      success("QR code added");
    },
    onError: (e: any) => error("Failed to add QR", e.message),
  });
}

export function useUpdateQR(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.updateQR>[1] }) =>
      api.updateQR(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payKeys.qrs(propertyId) });
      success("QR updated");
    },
    onError: (e: any) => error("Failed to update QR", e.message),
  });
}

export function useDeleteQR(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteQR(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payKeys.qrs(propertyId) });
      success("QR deleted");
    },
    onError: (e: any) => error("Failed to delete QR", e.message),
  });
}

// Summary
export function useRevenueSummary(propertyId?: string, filters?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: propertyId ? payKeys.summary(propertyId, filters) : ["revenue-summary", "none"],
    enabled: !!propertyId,
    queryFn: () => api.getRevenueSummary(propertyId!, filters),
  });
}
export function useUploadQRImage(propertyId: string) {
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (file: File) => api.uploadQRImage(propertyId, file),
    onSuccess: () => success("QR image uploaded"),
    onError: (e: any) => error("Upload failed", e.message),
  });
}
