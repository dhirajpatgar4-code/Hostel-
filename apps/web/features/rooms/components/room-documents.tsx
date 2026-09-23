"use client";
import { useRef, useState } from "react";
import {
  Folder, FileText, Upload, FolderPlus, Search, ChevronRight,
  Trash2, Download, Eye, Pencil, Home, Share2, Check, X, CheckSquare, Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toaster";
import {
  useRoomFolders, useRoomFiles, useRoomFileSearch, useRoomFolderPath,
  useCreateRoomFolder, useRenameRoomFolder, useDeleteRoomFolder,
  useUploadRoomFile, useDeleteRoomFile, useRenameRoomFile,
} from "@/features/room-documents/hooks";
import { getRoomFileSignedUrl } from "@/features/room-documents/api";
import type { RoomDocument, RoomFolder } from "@/features/room-documents/types";
import { useSelection } from "@/lib/use-selection";
import { shareFiles, whatsappShareUrl, downloadOne } from "@/lib/share";

export function RoomDocuments({ roomId, propertyId }: { roomId: string; propertyId: string }) {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [renameFolder, setRenameFolder] = useState<RoomFolder | null>(null);
  const [renameFile, setRenameFile] = useState<RoomDocument | null>(null);
  const [toDeleteFolder, setToDeleteFolder] = useState<RoomFolder | null>(null);
  const [toDeleteFile, setToDeleteFile] = useState<RoomDocument | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [shareMenu, setShareMenu] = useState(false);

  const { data: folders = [], isLoading: loadingFolders } = useRoomFolders(roomId, folderId);
  const { data: files = [], isLoading: loadingFiles } = useRoomFiles(roomId, folderId);
  const { data: searchResults = [] } = useRoomFileSearch(roomId, search);
  const { data: path = [] } = useRoomFolderPath(roomId, folderId ?? undefined);

  const createFolder = useCreateRoomFolder(roomId);
  const renameFolderM = useRenameRoomFolder(roomId);
  const deleteFolder = useDeleteRoomFolder(roomId);
  const uploadFile = useUploadRoomFile(roomId);
  const deleteFile = useDeleteRoomFile(roomId);
  const renameFileM = useRenameRoomFile(roomId);

  const { success, error: toastErr } = useToast();

  const sel = useSelection<string>();
  const [busy, setBusy] = useState(false);

  const showSearch = search.length >= 2;

  function exitSelection() {
    sel.clear();
    setSelectionMode(false);
    setShareMenu(false);
  }

  async function openFile(doc: RoomDocument) {
    try {
      const url = await getRoomFileSignedUrl(doc.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toastErr("Could not open", e.message);
    }
  }

  async function downloadSingle(doc: RoomDocument) {
    try {
      const url = await getRoomFileSignedUrl(doc.storage_path);
      await downloadOne(url, doc.original_filename ?? doc.title);
    } catch (e: any) {
      toastErr("Download failed", e.message);
    }
  }

  async function shareSingle(doc: RoomDocument) {
    try {
      const url = await getRoomFileSignedUrl(doc.storage_path);
      const result = await shareFiles(
        [{ url, name: doc.original_filename ?? doc.title }],
        doc.title
      );
      if (result.method === "native") success("Shared");
      else success("Downloaded — attach in WhatsApp/email");
    } catch (e: any) {
      toastErr("Share failed", e.message);
    }
  }

  async function downloadSelected() {
    setBusy(true);
    try {
      const items = await Promise.all(
        sel.list.map(async (id) => {
          const doc = files.find((f) => f.id === id) || searchResults.find((f) => f.id === id);
          if (!doc) return null;
          const url = await getRoomFileSignedUrl(doc.storage_path);
          return { url, name: doc.original_filename ?? doc.title };
        })
      );
      const valid = items.filter(Boolean) as { url: string; name: string }[];
      const result = await shareFiles(valid, "Room documents");
      success(`Downloaded ${result.count} file(s)`);
    } catch (e: any) {
      toastErr("Download failed", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function shareSelected() {
    setBusy(true);
    try {
      const items = await Promise.all(
        sel.list.map(async (id) => {
          const doc = files.find((f) => f.id === id) || searchResults.find((f) => f.id === id);
          if (!doc) return null;
          const url = await getRoomFileSignedUrl(doc.storage_path);
          return { url, name: doc.original_filename ?? doc.title };
        })
      );
      const valid = items.filter(Boolean) as { url: string; name: string }[];
      const result = await shareFiles(valid, "Room documents");
      if (result.method === "native") success(`Shared ${result.count} file(s)`);
      else success(`Downloaded ${result.count} file(s)`);
      exitSelection();
    } catch (e: any) {
      toastErr("Share failed", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function whatsappSelected() {
    const items = sel.list
      .map((id) => files.find((f) => f.id === id) || searchResults.find((f) => f.id === id))
      .filter(Boolean) as RoomDocument[];
    const links = await Promise.all(
      items.map(async (doc) => {
        const url = await getRoomFileSignedUrl(doc.storage_path, 3600);
        return `${doc.title}: ${url}`;
      })
    );
    window.open(whatsappShareUrl(links.join("\n")), "_blank", "noopener,noreferrer");
    exitSelection();
  }

  async function copySelectedLinks() {
    const items = sel.list
      .map((id) => files.find((f) => f.id === id) || searchResults.find((f) => f.id === id))
      .filter(Boolean) as RoomDocument[];
    const links = await Promise.all(
      items.map(async (doc) => {
        const url = await getRoomFileSignedUrl(doc.storage_path, 3600);
        return url;
      })
    );
    try {
      await navigator.clipboard.writeText(links.join("\n"));
      success(`Copied ${links.length} link(s)`);
    } catch {
      toastErr("Copy failed", "Clipboard blocked");
    }
    setShareMenu(false);
  }

  async function bulkDelete() {
    setBusy(true);
    try {
      for (const id of sel.list) {
        const doc = files.find((f) => f.id === id) || searchResults.find((f) => f.id === id);
        if (doc) await deleteFile.mutateAsync(doc);
      }
      success(`Deleted ${sel.count} file(s)`);
      exitSelection();
    } catch (e: any) {
      toastErr("Delete failed", e.message);
    } finally {
      setBusy(false);
    }
  }

  function navigate(id: string | null) {
    setFolderId(id);
    exitSelection();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle>
          Room Documents
          {selectionMode && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">{sel.count} selected</span>
          )}
        </CardTitle>

        <div className="flex items-center gap-2 flex-wrap">
          {selectionMode ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const all = [...folders.map((f) => f.id), ...files.map((f) => f.id)];
                  sel.count === all.length ? sel.clear() : sel.selectAll(files.map((f) => f.id));
                }}
              >
                {sel.count === files.length && files.length > 0 ? (
                  <><Square className="h-3.5 w-3.5 mr-1" /> Deselect</>
                ) : (
                  <><CheckSquare className="h-3.5 w-3.5 mr-1" /> Select all files</>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={downloadSelected} disabled={!sel.has || busy}>
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
              <div className="relative">
                <Button size="sm" onClick={() => setShareMenu((v) => !v)} disabled={!sel.has || busy}>
                  <Share2 className="h-3.5 w-3.5 mr-1" /> Share
                </Button>
                {shareMenu && sel.has && (
                  <div className="absolute right-0 mt-1 z-20 w-56 rounded-md border bg-background shadow-lg">
                    <button onClick={shareSelected} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60">
                      <Share2 className="h-3.5 w-3.5 inline mr-2" /> Share files (device)
                    </button>
                    <button onClick={whatsappSelected} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60">
                      WhatsApp (links)
                    </button>
                    <button onClick={copySelectedLinks} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60">
                      Copy links
                    </button>
                  </div>
                )}
              </div>
              <Button size="sm" variant="destructive" onClick={bulkDelete} disabled={!sel.has || busy}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={exitSelection}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setSelectionMode(true)} disabled={!files.length}>
                <CheckSquare className="h-3.5 w-3.5 mr-1" /> Select
              </Button>
              <Button size="sm" variant="outline" onClick={() => setNewFolderOpen(true)}>
                <FolderPlus className="h-3.5 w-3.5 mr-1" /> New Folder
              </Button>
              <Button size="sm" onClick={() => setUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Search + breadcrumb */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents by name…"
              className="pl-9"
            />
          </div>
          {!showSearch && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => navigate(null)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground px-2 py-1 rounded"
              >
                <Home className="h-3.5 w-3.5" /> Root
              </button>
              {path.map((f) => (
                <div key={f.id} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <button
                    onClick={() => navigate(f.id)}
                    className="text-muted-foreground hover:text-foreground px-2 py-1 rounded"
                  >
                    {f.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {showSearch ? (
          searchResults.length === 0 ? (
            <EmptyState title={`No files match "${search}"`} />
          ) : (
            <div className="divide-y border rounded-lg">
              {searchResults.map((f) => (
                <FileRow
                  key={f.id}
                  doc={f}
                  selected={sel.isSelected(f.id)}
                  selectionMode={selectionMode}
                  onSelect={() => sel.toggle(f.id)}
                  onOpen={openFile}
                  onDownload={downloadSingle}
                  onShare={shareSingle}
                  onRename={setRenameFile}
                  onDelete={setToDeleteFile}
                />
              ))}
            </div>
          )
        ) : loadingFolders || loadingFiles ? (
          <div className="h-32 bg-muted rounded animate-pulse" />
        ) : folders.length === 0 && files.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No documents yet"
            description="Upload warranty cards, manuals, receipts, or create a folder."
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
              <div className="divide-y border rounded-lg">
                {folders.map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30">
                    <button onClick={() => navigate(f.id)} className="flex items-center gap-3 flex-1 text-left">
                      <Folder className="h-5 w-5 text-amber-500" />
                      <span className="font-medium text-sm">{f.name}</span>
                    </button>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setRenameFolder(f)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setToDeleteFolder(f)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {files.length > 0 && (
              <div className="divide-y border rounded-lg">
                {files.map((f) => (
                  <FileRow
                    key={f.id}
                    doc={f}
                    selected={sel.isSelected(f.id)}
                    selectionMode={selectionMode}
                    onSelect={() => sel.toggle(f.id)}
                    onOpen={openFile}
                    onDownload={downloadSingle}
                    onShare={shareSingle}
                    onRename={setRenameFile}
                    onDelete={setToDeleteFile}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {selectionMode && (
          <p className="text-xs text-muted-foreground">
            Tick files to select. Use the toolbar above to share or download.
          </p>
        )}
      </CardContent>

      {/* Dialogs */}
      <NewFolderDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        onSubmit={async (name) => {
          await createFolder.mutateAsync({ propertyId, name, parentId: folderId });
          setNewFolderOpen(false);
        }}
      />

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSubmit={async (file, title, description) => {
          await uploadFile.mutateAsync({ propertyId, roomId, folderId, file, title, description });
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
        description="Files inside move to root. This cannot be undone."
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
    </Card>
  );
}

function FileRow({
  doc, selected, selectionMode, onSelect, onOpen, onDownload, onShare, onRename, onDelete,
}: {
  doc: RoomDocument;
  selected: boolean;
  selectionMode: boolean;
  onSelect: () => void;
  onOpen: (d: RoomDocument) => void;
  onDownload: (d: RoomDocument) => void;
  onShare: (d: RoomDocument) => void;
  onRename: (d: RoomDocument) => void;
  onDelete: (d: RoomDocument) => void;
}) {
  const size = doc.file_size ? (doc.file_size / 1024).toFixed(1) + " KB" : "";
  return (
    <div
      className={`flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 ${
        selected ? "bg-primary/10" : ""
      }`}
    >
      <button
        onClick={() => (selectionMode ? onSelect() : onOpen(doc))}
        className="flex items-center gap-3 flex-1 text-left min-w-0"
      >
        {selectionMode && (
          <div
            className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
              selected ? "bg-primary border-primary text-primary-foreground" : "border-input"
            }`}
          >
            {selected && <Check className="h-3 w-3" />}
          </div>
        )}
        <FileText className="h-5 w-5 text-blue-500 shrink-0" />
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{doc.title}</div>
          <div className="text-xs text-muted-foreground truncate">
            {doc.original_filename} · {size}
          </div>
        </div>
      </button>
      {!selectionMode && (
        <div className="flex gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => onOpen(doc)} title="Open">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDownload(doc)} title="Download">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onShare(doc)} title="Share">
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onRename(doc)} title="Rename">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onDelete(doc)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
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
        <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
        <form
          onSubmit={async (e) => { e.preventDefault(); if (!name) return; await onSubmit(name); setName(""); }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label>Folder name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Warranty Cards / Manuals / Receipts"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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
        <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
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
            <p className="text-xs text-muted-foreground">PDF, image, or any file · max 100 MB</p>
          </div>
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Geyser warranty card" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={async (e) => { e.preventDefault(); if (name) await onSubmit(name); }} className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
