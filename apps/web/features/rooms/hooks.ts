"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import type { Room, RoomAsset, RoomImage, RoomWithOccupancy } from "./types";
import { useToast } from "@/components/ui/toaster";

export const roomsKeys = {
  all: (pid: string) => ["rooms", pid] as const,
  detail: (id: string) => ["room", id] as const,
  assets: (id: string) => ["room-assets", id] as const,
  images: (id: string) => ["room-images", id] as const,
};

export function useRoomsWithOccupancy(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? roomsKeys.all(propertyId) : ["rooms", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listRoomsWithOccupancy(propertyId!),
  });
}

export function useRoom(id?: string) {
  return useQuery({
    queryKey: id ? roomsKeys.detail(id) : ["room", "none"],
    enabled: !!id,
    queryFn: () => api.getRoom(id!),
  });
}

export function useCreateRoom(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Omit<Room, "id" | "created_at" | "updated_at" | "archived">) => api.createRoom(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKeys.all(propertyId) });
      success("Room created");
    },
    onError: (e: any) => error("Failed to create room", e.message),
  });
}

export function useUpdateRoom(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Room> }) => api.updateRoom(id, patch),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: roomsKeys.all(propertyId) });
      qc.invalidateQueries({ queryKey: roomsKeys.detail(v.id) });
      success("Room updated");
    },
    onError: (e: any) => error("Failed to update room", e.message),
  });
}

export function useArchiveRoom(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.archiveRoom(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKeys.all(propertyId) });
      success("Room archived");
    },
    onError: (e: any) => error("Failed to archive room", e.message),
  });
}

// Assets
export function useRoomAssets(roomId?: string) {
  return useQuery({
    queryKey: roomId ? roomsKeys.assets(roomId) : ["room-assets", "none"],
    enabled: !!roomId,
    queryFn: () => api.listRoomAssets(roomId!),
  });
}

export function useCreateRoomAsset(roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createRoomAsset>[0]) => api.createRoomAsset(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: roomsKeys.assets(roomId) }); success("Asset added"); },
    onError: (e: any) => error("Failed to add asset", e.message),
  });
}

export function useUpdateRoomAsset(roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<RoomAsset> }) => api.updateRoomAsset(id, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: roomsKeys.assets(roomId) }); success("Asset updated"); },
    onError: (e: any) => error("Failed to update asset", e.message),
  });
}

export function useDeleteRoomAsset(roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteRoomAsset(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: roomsKeys.assets(roomId) }); success("Asset deleted"); },
    onError: (e: any) => error("Failed to delete asset", e.message),
  });
}

// Images
export function useRoomImages(roomId?: string) {
  return useQuery({
    queryKey: roomId ? roomsKeys.images(roomId) : ["room-images", "none"],
    enabled: !!roomId,
    queryFn: () => api.listRoomImages(roomId!),
  });
}

export function useUploadRoomImage(propertyId: string, roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (file: File) => api.uploadRoomImage(propertyId, roomId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKeys.images(roomId) });
      qc.invalidateQueries({ queryKey: roomsKeys.all(propertyId) });
      success("Image uploaded");
    },
    onError: (e: any) => error("Upload failed", e.message),
  });
}

export function useDeleteRoomImage(propertyId: string, roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (img: RoomImage) => api.deleteRoomImage(img),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKeys.images(roomId) });
      qc.invalidateQueries({ queryKey: roomsKeys.all(propertyId) });
      success("Image deleted");
    },
    onError: (e: any) => error("Failed to delete image", e.message),
  });
}

export function useSetPrimaryImage(roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (imageId: string) => api.setPrimaryRoomImage(roomId, imageId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: roomsKeys.images(roomId) }); success("Primary image set"); },
    onError: (e: any) => error("Failed to set primary", e.message),
  });
}