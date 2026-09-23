"use client";
import { useRef, useState } from "react";
import { Upload, Trash2, Star, Check, X, Share2, Download, CheckSquare, Square, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toaster";
import { useRoomImages, useUploadRoomImage, useDeleteRoomImage, useSetPrimaryImage } from "../hooks";
import { publicUrl } from "../api";
import type { RoomImage } from "../types";
import { useSelection } from "@/lib/use-selection";
import { shareFiles, whatsappShareUrl } from "@/lib/share";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function RoomImages({ roomId, propertyId }: { roomId: string; propertyId: string }) {
  const { data: images = [], isLoading } = useRoomImages(roomId);
  const upload = useUploadRoomImage(propertyId, roomId);
  const del = useDeleteRoomImage(propertyId, roomId);
  const setPrimary = useSetPrimaryImage(roomId);
  const { success, error: toastErr } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const sel = useSelection<string>();
  const [selectionMode, setSelectionMode] = useState(false);
  const [toDelete, setToDelete] = useState<RoomImage | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shareMenu, setShareMenu] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const longPressTimer = useRef<number | null>(null);
  function onTouchStart(id: string) {
    longPressTimer.current = window.setTimeout(() => {
      setSelectionMode(true);
      sel.toggle(id);
    }, 400);
  }
  function onTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTileClick(id: string, index: number) {
    if (selectionMode) sel.toggle(id);
    else setViewerIndex(index);
  }

  function exitSelection() {
    sel.clear();
    setSelectionMode(false);
    setShareMenu(false);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) { toastErr("Unsupported", `${file.name}: only images allowed`); continue; }
      if (file.size > MAX_SIZE) { toastErr("Too large", `${file.name}: max 10 MB`); continue; }
      try {
        await upload.mutateAsync(file);
      } catch (e: any) {
        toastErr("Upload failed", e.message);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function urlFor(img: RoomImage) {
    return publicUrl("room-images", img.storage_path);
  }

  function filenameFor(img: RoomImage, idx = 0) {
    const roomPart = `room-${roomId.slice(0, 6)}`;
    const stamp = new Date().toISOString().slice(0, 10);
    const ext = img.storage_path.split(".").pop() ?? "jpg";
    return `${roomPart}-${stamp}-${idx + 1}.${ext}`;
  }

  async function downloadSingle(img: RoomImage) {
    const url = urlFor(img);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filenameFor(img);
      a.click();
    } catch (e: any) {
      toastErr("Download failed", e.message);
    }
  }

  async function shareSingle(img: RoomImage) {
    try {
      const result = await shareFiles([{ url: urlFor(img), name: filenameFor(img) }]);
      if (result.method === "native") success("Shared");
      else success("Downloaded — attach in WhatsApp/email");
    } catch (e: any) {
      toastErr("Share failed", e.message);
    }
  }

  async function handleDownloadSelected() {
    setBusy(true);
    try {
      const items = sel.list
        .map((id) => images.find((i) => i.id === id))
        .filter(Boolean)
        .map((img, i) => ({ url: urlFor(img as RoomImage), name: filenameFor(img as RoomImage, i) }));
      for (const it of items) {
        const res = await fetch(it.url);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = it.name;
        a.click();
      }
      success(`Downloaded ${items.length} image(s)`);
    } catch (e: any) {
      toastErr("Download failed", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleNativeShare() {
    setBusy(true);
    try {
      const items = sel.list
        .map((id) => images.find((i) => i.id === id))
        .filter(Boolean)
        .map((img, i) => ({ url: urlFor(img as RoomImage), name: filenameFor(img as RoomImage, i) }));
      const result = await shareFiles(items, "Room images");
      if (result.method === "native") success(`Shared ${result.count} image(s)`);
      else success(`Downloaded ${result.count} image(s) — attach in WhatsApp/email`);
      exitSelection();
    } catch (e: any) {
      toastErr("Share failed", e.message);
    } finally {
      setBusy(false);
    }
  }

  function handleWhatsapp() {
    const items = sel.list.map((id) => images.find((i) => i.id === id)).filter(Boolean);
    const text = items.map((img) => urlFor(img as RoomImage)).join("\n");
    window.open(whatsappShareUrl(text), "_blank", "noopener,noreferrer");
    exitSelection();
  }

  async function handleCopyLinks() {
    const items = sel.list.map((id) => images.find((i) => i.id === id)).filter(Boolean);
    const text = items.map((img) => urlFor(img as RoomImage)).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      success(`Copied ${items.length} link(s)`);
    } catch {
      toastErr("Copy failed", "Clipboard blocked by browser");
    }
    setShareMenu(false);
  }

  async function handleBulkDelete() {
    setBusy(true);
    try {
      for (const id of sel.list) {
        const img = images.find((i) => i.id === id);
        if (img) await del.mutateAsync(img);
      }
      success(`Deleted ${sel.count} image(s)`);
      exitSelection();
    } catch (e: any) {
      toastErr("Delete failed", e.message);
    } finally {
      setBusy(false);
      setBulkDeleteOpen(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle>
          Photos
          {selectionMode && <span className="ml-2 text-sm font-normal text-muted-foreground">{sel.count} selected</span>}
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          {selectionMode ? (
            <>
              <Button size="sm" variant="outline" onClick={() => sel.count === images.length ? sel.clear() : sel.selectAll(images.map((i) => i.id))}>
                {sel.count === images.length ? <><Square className="h-3.5 w-3.5 mr-1" /> Deselect</> : <><CheckSquare className="h-3.5 w-3.5 mr-1" /> Select all</>}
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadSelected} disabled={!sel.has || busy}>
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
              <div className="relative">
                <Button size="sm" onClick={() => setShareMenu((v) => !v)} disabled={!sel.has || busy}>
                  <Share2 className="h-3.5 w-3.5 mr-1" /> Share
                </Button>
                {shareMenu && sel.has && (
                  <div className="absolute right-0 mt-1 z-20 w-56 rounded-md border bg-background shadow-lg">
                    <button onClick={handleNativeShare} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60">
                      <Share2 className="h-3.5 w-3.5 inline mr-2" /> Share files (device)
                    </button>
                    <button onClick={handleWhatsapp} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60">
                      WhatsApp (links)
                    </button>
                    <button onClick={handleCopyLinks} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60">
                      Copy links
                    </button>
                  </div>
                )}
              </div>
              <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)} disabled={!sel.has || busy}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={exitSelection}><X className="h-3.5 w-3.5" /></Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setSelectionMode(true)} disabled={!images.length}>
                <CheckSquare className="h-3.5 w-3.5 mr-1" /> Select
              </Button>
              <input ref={fileRef} type="file" accept={ACCEPTED.join(",")} multiple hidden onChange={(e) => handleFiles(e.target.files)} />
              <Button size="sm" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
                <Upload className="h-3.5 w-3.5 mr-1" /> {upload.isPending ? "Uploading…" : "Upload"}
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />)}</div>
        ) : !images.length ? (
          <EmptyState title="No photos yet" description="Upload room photos to keep records." action={<Button size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-1" /> Upload Photo</Button>} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, i) => {
              const isSel = sel.isSelected(img.id);
              return (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer"
                  onClick={() => handleTileClick(img.id, i)}
                  onTouchStart={() => onTouchStart(img.id)}
                  onTouchEnd={onTouchEnd}
                  onTouchCancel={onTouchEnd}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlFor(img)} alt={img.original_filename ?? ""} className="w-full h-full object-cover" draggable={false} />
                  {img.is_primary && !selectionMode && <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded">Primary</div>}
                  {selectionMode && (
                    <div className="absolute top-1 right-1">
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSel ? "bg-primary border-primary text-primary-foreground" : "bg-white/80 border-white/80 text-transparent"}`}>
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  )}
                  {isSel && <div className="absolute inset-0 ring-2 ring-primary ring-inset bg-primary/20 pointer-events-none" />}
                  {!selectionMode && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setViewerIndex(i); }} title="View"><Check className="h-3.5 w-3.5" /></Button>
                      {!img.is_primary && <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setPrimary.mutate(img.id); }} title="Set primary"><Star className="h-3.5 w-3.5" /></Button>}
                      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); shareSingle(img); }} title="Share"><Share2 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); setToDelete(img); }} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {selectionMode && <p className="text-xs text-muted-foreground mt-3">Tap images to select. Long-press any image to enter selection mode.</p>}
        {!selectionMode && images.length > 0 && <p className="text-xs text-muted-foreground mt-3">Click any image to open it in a full-screen viewer.</p>}
      </CardContent>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete image?"
        description="This photo will be permanently removed."
        confirmLabel="Delete"
        onConfirm={async () => { if (toDelete) await del.mutateAsync(toDelete); setToDelete(null); }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${sel.count} image(s)?`}
        description="All selected photos will be permanently removed."
        confirmLabel="Delete all"
        onConfirm={handleBulkDelete}
      />

      {/* Full-screen viewer */}
      <ImageViewer
        images={images}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
        onNavigate={setViewerIndex}
        urlFor={urlFor}
        filenameFor={filenameFor}
        onDownload={downloadSingle}
        onShare={shareSingle}
      />
    </Card>
  );
}

function ImageViewer({
  images, index, onClose, onNavigate, urlFor, filenameFor, onDownload, onShare,
}: {
  images: RoomImage[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
  urlFor: (img: RoomImage) => string;
  filenameFor: (img: RoomImage, idx?: number) => string;
  onDownload: (img: RoomImage) => Promise<void>;
  onShare: (img: RoomImage) => Promise<void>;
}) {
  const open = index !== null && images[index];
  const img = open ? images[index!] : null;

  function next() { if (index !== null) onNavigate((index + 1) % images.length); }
  function prev() { if (index !== null) onNavigate((index - 1 + images.length) % images.length); }

  return (
    <Dialog open={!!open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl p-0 bg-black border-none overflow-hidden">
        <div className="relative w-full h-[80vh] flex items-center justify-center">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlFor(img)} alt={img.original_filename ?? ""} className="max-h-full max-w-full object-contain" />
          )}
          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute top-3 left-3 text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
                {(index ?? 0) + 1} / {images.length}
              </div>
            </>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {img && (
              <>
                <Button size="sm" variant="secondary" onClick={() => onDownload(img)}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Download
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onShare(img)}>
                  <Share2 className="h-3.5 w-3.5 mr-1" /> Share
                </Button>
              </>
            )}
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
