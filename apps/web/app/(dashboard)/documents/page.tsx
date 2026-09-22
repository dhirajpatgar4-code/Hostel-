"use client";
import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Folder, FileText, Upload, FolderPlus, Search, ChevronRight,
  Trash2, Download, Eye, Pencil, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProperty } from "@/features/properties/hooks";
import {
  useFolders, useFiles, useSearchFiles, useFolderPath,
  useCreateFolder, useRenameFolder, useDeleteFolder,
  useUploadFile, useDeleteFile, useRenameFile,
} from "@/features/documents/hooks";
import { getFileSignedUrl } from "@/features/documents/api";
import type { DocumentRecord, DocumentFolder } from "@/features/documents/types";

// ─── Wrapper: provides the Suspense boundary that useSearchParams requires
export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="h-40 bg-muted rounded animate-pulse" />}>
      <DocumentsInner />
    </Suspense>
  );
}

// ─── The real page
function DocumentsInner() {
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const router = useRouter();
  const sp = useSearchParams();
  const folderId = sp.get("folder");

  const [search, setSearch] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [renameFolder, setRenameFolder] = useState<DocumentFolder | null>(null);
  const [renameFile, setRenameFile] = useState<DocumentRecord | null>(null);
  const [toDeleteFolder, setToDeleteFolder] = useState<DocumentFolder | null>(null);
  const [toDeleteFile, setToDeleteFile] = useState<DocumentRecord | null>(null);

  const { data: folders = [], isLoading: loadingFolders } = useFolders(propertyId, folderId);
  const { data: files = [], isLoading: loadingFiles } = useFiles(propertyId, folderId);
  const { data: searchResults = [] } = useSearchFiles(propertyId, search);
  const { data: path = [] } = useFolderPath(folderId ?? undefined, propertyId);

  const createFolder = useCreateFolder(propertyId);
  const renameFolderM = useRenameFolder(propertyId);
  const deleteFolder = useDeleteFolder(propertyId);
  const uploadFile = useUploadFile(propertyId);
  const deleteFile = useDeleteFile(propertyId);
  const renameFileM = useRenameFile(propertyId);

  function navigateToFolder(id: string | null) {
    if (id === null) router.push("/documents");
    else router.push(`/documents?folder=${id}`);
  }

  async function openFile(doc: DocumentRecord) {
    try {
      const url = await getFileSignedUrl(doc.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      alert("Could not open: " + e.message);
    }
  }

  async function downloadFile(doc: DocumentRecord) {
    try {
      const url = await getFileSignedUrl(doc.storage_path);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.original_filename ?? doc.title;
      a.click();
    } catch (e: any) {
      alert("Download failed: " + e.message);
    }
  }

  if (!propertyId) return <div className="text-muted-foreground">Loading property…</div>;

  const showSearch = search.length >= 2;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">Folders and files — like Google Drive</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-1" /> New Folder
          </Button>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> Upload
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files by name, tag or description…"
              className="pl-9"
            />
          </div>
          {!showSearch && (
            <div className="flex items-center gap-1 text-sm">
              <button
                onClick={() => navigateToFolder(null)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground px-2 py-1 rounded"
              >
                <Home className="h-3.5 w-3.5" /> Root
              </button>
              {path.map((f) => (
                <div key={f.id} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <button
                    onClick={() => navigateToFolder(f.id)}
                    className="text-muted-foreground hover:text-foreground px-2 py-1 rounded"
                  >
                    {f.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showSearch ? (
        <Card>
          <CardContent className="p-0">
            {!searchResults.length ? (
              <EmptyState title={`No files match "${search}"`} />
            ) : (
              <div className="divide-y">
                {searchResults.map((f) => (
                  <FileRow
                    key={f.id}
                    doc={f}
                    onOpen={openFile}
                    onDownload={downloadFile}
                    onRename={setRenameFile}
                    onDelete={setToDeleteFile}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-1 h-fit">
            <CardContent className="p-2">
              <button
                onClick={() => navigateToFolder(null)}
                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                  !folderId ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/40"
                }`}
              >
                <Home className="h-4 w-4" /> Root
              </button>
              <div className="mt-1 space-y-0.5">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => navigateToFolder(f.id)}
                    className="w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-muted/40"
                  >
                    <Folder className="h-4 w-4 text-amber-500" />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-3 space-y-4">
            {loadingFolders || loadingFiles ? (
              <div className="h-40 bg-muted rounded animate-pulse" />
            ) : folders.length === 0 && files.length === 0 ? (
              <EmptyState
                icon={Folder}
                title="This folder is empty"
                description="Create a folder or upload a file to get started."
                action={
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setNewFolderOpen(true)}>
                      <FolderPlus className="h-4 w-4 mr-1" /> New Folder
                    </Button>
                    <Button onClick={() => setUploadOpen(true)}>
                      <Upload className="h-4 w-4 mr-1" /> Upload
                    </Button>
                  </div>
                }
              />
            ) : (
              <>
                {folders.length > 0 && (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {folders.map((f) => (
                          <div key={f.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                            <button
                              onClick={() => navigateToFolder(f.id)}
                              className="flex items-center gap-3 flex-1 text-left"
                            >
                              <Folder className="h-5 w-5 text-amber-500" />
                              <span className="font-medium">{f.name}</span>
                            </button>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setRenameFolder(f)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => setToDeleteFolder(f)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {files.length > 0 && (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {files.map((f) => (
                          <FileRow
                            key={f.id}
                            doc={f}
                            onOpen={openFile}
                            onDownload={downloadFile}
                            onRename={setRenameFile}
                            onDelete={setToDeleteFile}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <NewFolderDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        onSubmit={async (name) => {
          await createFolder.mutateAsync({ name, parentId: folderId });
          setNewFolderOpen(false);
        }}
      />

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSubmit={async (file, title, description) => {
          await uploadFile.mutateAsync({
            propertyId,
            folderId,
            file,
            title: title || file.name,
            description,
          });
          setUploadOpen(false);
        }}
      />

      <RenameDialog
        open={!!renameFolder}
        onOpenChange={(o) => !o && setRenameFolder(null)}
        title="Rename folder"
        initial={renameFolder?.name ?? ""}
        onSubmit={async (name) => {
          if (renameFolder) await renameFolderM.mutateAsync({ id: renameFolder.id, name });
          setRenameFolder(null);
        }}
      />

      <RenameDialog
        open={!!renameFile}
        onOpenChange={(o) => !o && setRenameFile(null)}
        title="Rename file"
        initial={renameFile?.title ?? ""}
        onSubmit={async (title) => {
          if (renameFile) await renameFileM.mutateAsync({ id: renameFile.id, title });
          setRenameFile(null);
        }}
      />

      <ConfirmDialog
        open={!!toDeleteFolder}
        onOpenChange={(o) => !o && setToDeleteFolder(null)}
        title={`Delete folder "${toDeleteFolder?.name}"?`}
        description="All files inside will be moved to root. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (toDeleteFolder) await deleteFolder.mutateAsync(toDeleteFolder.id);
          setToDeleteFolder(null);
        }}
      />

      <ConfirmDialog
        open={!!toDeleteFile}
        onOpenChange={(o) => !o && setToDeleteFile(null)}
        title={`Delete "${toDeleteFile?.title}"?`}
        description="The file will be permanently removed."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (toDeleteFile) await deleteFile.mutateAsync(toDeleteFile);
          setToDeleteFile(null);
        }}
      />
    </div>
  );
}

function FileRow({
  doc, onOpen, onDownload, onRename, onDelete,
}: {
  doc: DocumentRecord;
  onOpen: (d: DocumentRecord) => void;
  onDownload: (d: DocumentRecord) => void;
  onRename: (d: DocumentRecord) => void;
  onDelete: (d: DocumentRecord) => void;
}) {
  const size = doc.file_size ? (doc.file_size / 1024).toFixed(1) + " KB" : "";
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
      <button onClick={() => onOpen(doc)} className="flex items-center gap-3 flex-1 text-left min-w-0">
        <FileText className="h-5 w-5 text-blue-500 shrink-0" />
        <div className="min-w-0">
          <div className="font-medium truncate">{doc.title}</div>
          <div className="text-xs text-muted-foreground truncate">
            {doc.original_filename} · {size}
          </div>
        </div>
      </button>
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => onOpen(doc)}>
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDownload(doc)}>
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onRename(doc)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(doc)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function NewFolderDialog({
  open, onOpenChange, onSubmit,
}: { open: boolean; onOpenChange: (o: boolean) => void; onSubmit: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setName(""); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name) return;
            await onSubmit(name);
            setName("");
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label>Folder name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Water Bills / Ads / Agreements"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({
  open, onOpenChange, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (file: File, title: string, description: string) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) { setFile(null); setTitle(""); setDescription(""); }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload file</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!file) return;
            await onSubmit(file, title, description);
            setFile(null); setTitle(""); setDescription("");
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !title) setTitle(f.name);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" /> {file ? file.name : "Select file"}
            </Button>
            <p className="text-xs text-muted-foreground">Any file type · max 50 MB</p>
          </div>

          <div className="space-y-1">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water bill Sep 2026"
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file}>Upload</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RenameDialog({
  open, onOpenChange, title, initial, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  initial: string;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial);
  useState(() => setName(initial));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (name) await onSubmit(name);
          }}
          className="space-y-4"
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
