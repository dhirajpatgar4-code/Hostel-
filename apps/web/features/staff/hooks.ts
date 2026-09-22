"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { useToast } from "@/components/ui/toaster";
import type { AttendanceStatus } from "./types";

export const staffKeys = {
  list: (pid: string) => ["staff", pid] as const,
  attendance: (pid: string, m: number, y: number) => ["attendance", pid, m, y] as const,
  attendanceStaff: (sid: string, m: number, y: number) => ["attendance-staff", sid, m, y] as const,
  salary: (sid: string) => ["salary", sid] as const,
};

export function useStaff(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? staffKeys.list(propertyId) : ["staff", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listStaff(propertyId!),
  });
}

export function useCreateStaff(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createStaff>[0]) => api.createStaff(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: staffKeys.list(propertyId) }); success("Staff added"); },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useUpdateStaff(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.updateStaff>[1] }) =>
      api.updateStaff(id, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: staffKeys.list(propertyId) }); success("Updated"); },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useArchiveStaff(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.archiveStaff(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: staffKeys.list(propertyId) }); success("Archived"); },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useAttendanceMonth(propertyId?: string, month?: number, year?: number) {
  return useQuery({
    queryKey: propertyId && month && year ? staffKeys.attendance(propertyId, month, year) : ["attendance", "none"],
    enabled: !!propertyId && !!month && !!year,
    queryFn: () => api.listAllAttendanceForMonth(propertyId!, month!, year!),
  });
}

export function useAttendanceForStaff(staffId?: string, month?: number, year?: number) {
  return useQuery({
    queryKey: staffId && month && year ? staffKeys.attendanceStaff(staffId, month, year) : ["attendance-staff", "none"],
    enabled: !!staffId && !!month && !!year,
    queryFn: () => api.listAttendanceForMonth(staffId!, month!, year!),
  });
}

export function useUpsertAttendance(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.upsertAttendance>[0]) => api.upsertAttendance(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-staff"] });
      success("Attendance saved");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useDeleteAttendance(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ staffId, date }: { staffId: string; date: string }) =>
      api.deleteAttendance(staffId, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-staff"] });
      success("Cleared");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useSalary(staffId?: string) {
  return useQuery({
    queryKey: staffId ? staffKeys.salary(staffId) : ["salary", "none"],
    enabled: !!staffId,
    queryFn: () => api.listSalary(staffId!),
  });
}

export function useRecordSalary(propertyId: string, staffId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.recordSalary>[0]) => api.recordSalary(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.salary(staffId) });
      success("Salary recorded");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}
