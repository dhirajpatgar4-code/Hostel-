"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { useToast } from "@/components/ui/toaster";
import type { DocumentRecord } from "./types";

export const docKeys = {
  folders: (pid: string, parentId: string | null) => ["doc-folders", pid, parentId] as const,
  allFolders: (pid: string) => ["doc-folders-all", pid] as const,
  files: (pid: string, folderId: string | null) => ["doc-files", pid, folderId] as const,
  search: (pid: string, q: string) => ["doc-search", pid, q] as const,
  path: (fid: string, pid: string) => ["doc-path", pid, fid] as const,
};

export function useFolders(propertyId?: string, parentId: string | null = null) {
  return useQuery({
    queryKey: propertyId ? docKeys.folders(propertyId, parentId) : ["doc-folders", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listFolders(propertyId!, parentId),
  });
}

export function useAllFolders(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? docKeys.allFolders(propertyId) : ["doc-folders-all", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listAllFolders(propertyId!),
  });
}

export function useFiles(propertyId?: string, folderId: string | null = null) {
  return useQuery({
    queryKey: propertyId ? docKeys.files(propertyId, folderId) : ["doc-files", "none"],
    enabled: !!propertyId,
    queryFn: () => api.listFiles(propertyId!, folderId),
  });
}

export function useSearchFiles(propertyId?: string, query?: string) {
  return useQuery({
    queryKey: propertyId && query ? docKeys.search(propertyId, query) : ["doc-search", "none"],
    enabled: !!propertyId && !!query && query.length >= 2,
    queryFn: () => api.searchFiles(propertyId!, query!),
  });
}

export function useCreateFolder(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId: string | null }) =>
      api.createFolder(propertyId, name, parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-folders"] });
      qc.invalidateQueries({ queryKey: ["doc-folders-all"] });
      success("Folder created");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useRenameFolder(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.renameFolder(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-folders"] });
      success("Renamed");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useDeleteFolder(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.deleteFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-folders"] });
      qc.invalidateQueries({ queryKey: ["doc-folders-all"] });
      success("Folder deleted");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useUploadFile(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.uploadFile>[0]) => api.uploadFile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-files"] });
      qc.invalidateQueries({ queryKey: ["doc-search"] });
      success("File uploaded");
    },
    onError: (e: any) => error("Upload failed", e.message),
  });
}

export function useDeleteFile(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (doc: DocumentRecord) => api.deleteFile(doc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-files"] });
      qc.invalidateQueries({ queryKey: ["doc-search"] });
      success("File deleted");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useRenameFile(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.renameFile(id, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-files"] });
      success("Renamed");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useMoveFile(propertyId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      api.moveFile(id, folderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-files"] });
      success("Moved");
    },
    onError: (e: any) => error("Failed", e.message),
  });
}

export function useFolderPath(folderId?: string, propertyId?: string) {
  return useQuery({
    queryKey: folderId && propertyId ? docKeys.path(folderId, propertyId) : ["doc-path", "none"],
    enabled: !!folderId && !!propertyId,
    queryFn: () => api.getFolderPath(folderId!, propertyId!),
  });
}
