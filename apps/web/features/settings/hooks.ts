"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { useToast } from "@/components/ui/toaster";
import type { UserRole } from "./types";

export const settingsKeys = {
  team: (pid: string) => ["team", pid] as const,
  invites: (pid: string) => ["invites", pid] as const,
  hostel: (pid: string) => ["hostel-settings", pid] as const,
  prefs: (uid: string) => ["notification-prefs", uid] as const,
};

export function useTeam(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? settingsKeys.team(propertyId) : ["team", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listTeamMembers(propertyId!),
  });
}

export function useInvites(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? settingsKeys.invites(propertyId) : ["invites", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listInvites(propertyId!),
  });
}

export function useCreateInvite(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: UserRole }) =>
      api.createInvite(propertyId, email, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.invites(propertyId) });
      success("Invite created", "They will get access after signing in with that email.");
    },
    onError: (e: any) => error("Failed to invite", e.message),
  });
}

export function useRevokeInvite(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.revokeInvite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.invites(propertyId) });
      success("Invite revoked");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useDeleteInvite(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteInvite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.invites(propertyId) });
      success("Invite removed");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useUpdateMemberRole(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      api.updateMemberRole(propertyId, userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.team(propertyId) });
      success("Role updated");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useRemoveMember(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (userId: string) => api.removeMember(propertyId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.team(propertyId) });
      success("Member removed");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useUpdateProperty(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (patch: Parameters<typeof api.updateProperty>[1]) =>
      api.updateProperty(propertyId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      success("Settings updated");
    },
    onError: (e: any) => error("Failed to update", e.message),
  });
}

export function useNotificationPrefs(userId?: string) {
  return useQuery({
    queryKey: userId ? settingsKeys.prefs(userId) : ["notification-prefs", "none"],
    enabled: !!userId,
    queryFn: () => api.getNotificationPreferences(userId!),
  });
}

export function useUpdateNotificationPrefs(userId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (patch: any) => api.updateNotificationPreferences(userId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.prefs(userId) });
      success("Preferences saved");
    },
    onError: (e: any) => error("Failed to save", e.message),
  });
}
