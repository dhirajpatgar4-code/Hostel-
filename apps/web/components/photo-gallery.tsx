"use client";
import { useEffect, useRef, useState } from "react";
import {
  Upload, X, Eye, Trash2, Share2, ChevronLeft, ChevronRight, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import {
  uploadPhoto, deletePhoto, getPhotoSignedUrl, validatePhoto,
  type PhotoMeta,
} from "@/lib/photos";
import { shareFiles } from "@/lib/share";

export function PhotoGallery({
  photos,
  onChange,
  propertyId,
  scope,
  max = 10,
  label = "Photos",
}: {
  photos: PhotoMeta[];
  onChange: (next: PhotoMeta[]) => void;
  propertyId: string;
  scope: string;
  max?: number;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const { success, error: toastErr } = useToast();

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    try {
      const toAdd: PhotoMeta[] = [];
      for (const file of Array.from(files)) {
        const err = validatePhoto(file);
        if (err) {
          toastErr("Invalid file", `${file.name}: ${err}`);
          continue;
        }
        if (photos.length + toAdd.length >= max) {
          toastErr("Limit reached", `Max ${max} photos`);
          break;
        }
        const meta = await uploadPhoto(propertyId, scope, file);
        toAdd.push(meta);
      }
      if (toAdd.length) {
        onChange([...photos, ...toAdd]);
        success(`Uploaded ${toAdd.length} photo(s)`);
      }
    } catch (e: any) {
      toastErr("Upload failed", e.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemove(meta: PhotoMeta) {
    try {
      await deletePhoto(meta.path);
      onChange(photos.filter((p) => p.path !== meta.path));
      success("Photo removed");
    } catch (e: any) {
      toastErr("Delete failed", e.message);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase text-muted-foreground">{label}</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={busy || photos.length >= max}
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          {busy ? "Uploading…" : `Add (${photos.length}/${max})`}
        </Button>
      </div>

      {!photos.length ? (
        <div className="border border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
          No photos attached yet — click <span className="font-medium">Add</span> to upload.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <PhotoThumb
              key={p.path}
              meta={p}
              onOpen={() => setViewerIndex(i)}
              onRemove={() => handleRemove(p)}
            />
          ))}
        </div>
      )}

      <Lightbox
        photos={photos}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
        onNavigate={setViewerIndex}
      />
    </div>
  );
}

function PhotoThumb({
  meta,
  onOpen,
  onRemove,
}: {
  meta: PhotoMeta;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // ✅ useEffect re-runs whenever the path changes
  useEffect(() => {
    let alive = true;
    setUrl(null);
    setFailed(false);
    getPhotoSignedUrl(meta.path)
      .then((u) => {
        if (alive) setUrl(u);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [meta.path]);

  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={meta.name}
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={onOpen}
        />
      ) : failed ? (
        <div className="w-full h-full flex items-center justify-center text-xs text-destructive text-center p-2">
          Failed to load
        </div>
      ) : (
        <div className="w-full h-full animate-pulse bg-muted" />
      )}

      {/* Actions — always visible on touch devices (no hover) */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-1 pointer-events-none group-hover:pointer-events-auto focus-within:pointer-events-auto">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          title="View"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: PhotoMeta[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { success, error: toastErr } = useToast();

  const open = index !== null && photos[index];
  const current = open ? photos[index!] : null;

  // ✅ useEffect re-fetches when index changes
  useEffect(() => {
    let alive = true;
    if (!current) {
      setUrl(null);
      return;
    }
    setUrl(null);
    getPhotoSignedUrl(current.path)
      .then((u) => {
        if (alive) setUrl(u);
      })
      .catch((e) => {
        if (alive) {
          setUrl(null);
          toastErr("Could not load image", e.message);
        }
      });
    return () => {
      alive = false;
    };
  }, [current?.path]);

  if (!open) return null;

  function next() {
    if (index === null) return;
    onNavigate((index + 1) % photos.length);
  }
  function prev() {
    if (index === null) return;
    onNavigate((index - 1 + photos.length) % photos.length);
  }

  async function download() {
    if (!current || !url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = current.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      success("Downloaded");
    } catch (e: any) {
      toastErr("Download failed", e.message);
    }
  }

  async function share() {
    if (!current || !url) return;
    setBusy(true);
    try {
      const result = await shareFiles([{ url, name: current.name }]);
      if (result.method === "native") success("Shared");
      else success("Downloaded — attach in WhatsApp/email");
    } catch (e: any) {
      toastErr("Share failed", e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl p-0 bg-black border-none overflow-hidden">
        <div className="relative w-full h-[80vh] flex items-center justify-center">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={current?.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-white/60 text-sm">Loading…</div>
          )}

          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute top-3 left-3 text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
                {(index ?? 0) + 1} / {photos.length}
              </div>
            </>
          )}

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={download} disabled={!url}>
              <Download className="h-3.5 w-3.5 mr-1" /> Download
            </Button>
            <Button size="sm" variant="secondary" onClick={share} disabled={!url || busy}>
              <Share2 className="h-3.5 w-3.5 mr-1" /> Share
            </Button>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
