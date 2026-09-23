"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { useToast } from "@/components/ui/toaster";
import type { RoomDocument } from "./types";

export const roomDocKeys = {
  folders: (rid: string, parentId: string | null) => ["roomdoc-folders", rid, parentId] as const,
  allFolders: (rid: string) => ["roomdoc-folders-all", rid] as const,
  files: (rid: string, folderId: string | null) => ["roomdoc-files", rid, folderId] as const,
  search: (rid: string, q: string) => ["roomdoc-search", rid, q] as const,
  path: (rid: string, fid: string) => ["roomdoc-path", rid, fid] as const,
};

export function useRoomFolders(roomId?: string, parentId: string | null = null) {
  return useQuery({
    queryKey: roomId ? roomDocKeys.folders(roomId, parentId) : ["roomdoc-folders", "none"],
    enabled: !!roomId,
    queryFn: () => api.listRoomFolders(roomId!, parentId),
  });
}

export function useRoomFiles(roomId?: string, folderId: string | null = null) {
  return useQuery({
    queryKey: roomId ? roomDocKeys.files(roomId, folderId) : ["roomdoc-files", "none"],
    enabled: !!roomId,
    queryFn: () => api.listRoomFiles(roomId!, folderId),
  });
}

export function useRoomFileSearch(roomId?: string, query?: string) {
  return useQuery({
    queryKey: roomId && query ? roomDocKeys.search(roomId, query) : ["roomdoc-search", "none"],
    enabled: !!roomId && !!query && query.length >= 2,
    queryFn: () => api.searchRoomFiles(roomId!, query!),
  });
}

export function useRoomFolderPath(roomId?: string, folderId?: string) {
  return useQuery({
    queryKey: roomId && folderId ? roomDocKeys.path(roomId, folderId) : ["roomdoc-path", "none"],
    enabled: !!roomId && !!folderId,
    queryFn: () => api.getRoomFolderPath(folderId!, roomId!),
  });
}

export function useCreateRoomFolder(roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ propertyId, name, parentId }: { propertyId: string; name: string; parentId: string | null }) =>
      api.createRoomFolder(propertyId, roomId, name, parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roomdoc-folders"] });
      qc.invalidateQueries({ queryKey: ["roomdoc-folders-all"] });
      success("Folder created");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useRenameRoomFolder(roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.renameRoomFolder(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roomdoc-folders"] });
      success("Renamed");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useDeleteRoomFolder(roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteRoomFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roomdoc-folders"] });
      qc.invalidateQueries({ queryKey: ["roomdoc-folders-all"] });
      success("Folder deleted");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useUploadRoomFile(roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.uploadRoomFile>[0]) => api.uploadRoomFile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roomdoc-files"] });
      qc.invalidateQueries({ queryKey: ["roomdoc-search"] });
      success("File uploaded");
    },
    onError: (e: any) => error("Upload failed", e.message),
  });
}

export function useDeleteRoomFile(roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (doc: RoomDocument) => api.deleteRoomFile(doc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roomdoc-files"] });
      qc.invalidateQueries({ queryKey: ["roomdoc-search"] });
      success("File deleted");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useRenameRoomFile(roomId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.renameRoomFile(id, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roomdoc-files"] });
      success("Renamed");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}
