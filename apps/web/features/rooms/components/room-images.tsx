"use client";
import { useRef, useState } from "react";
import { Upload, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRoomImages, useUploadRoomImage, useDeleteRoomImage, useSetPrimaryImage } from "../hooks";
import { publicUrl } from "../api";
import type { RoomImage } from "../types";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function RoomImages({ roomId, propertyId }: { roomId: string; propertyId: string }) {
  const { data: images = [], isLoading } = useRoomImages(roomId);
  const upload = useUploadRoomImage(propertyId, roomId);
  const del = useDeleteRoomImage(propertyId, roomId);
  const setPrimary = useSetPrimaryImage(roomId);
  const [toDelete, setToDelete] = useState<RoomImage | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) { alert(`${file.name}: unsupported type`); continue; }
      if (file.size > MAX_SIZE) { alert(`${file.name}: too large (max 5 MB)`); continue; }
      await upload.mutateAsync(file);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Photos</CardTitle>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            <Upload className="h-4 w-4 mr-1" /> {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : !images.length ? (
          <EmptyState
            title="No photos yet"
            description="Upload room photos to keep records."
            action={
              <Button size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Upload Photo
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicUrl("room-images", img.storage_path)}
                  alt={img.original_filename ?? ""}
                  className="w-full h-full object-cover"
                />
                {img.is_primary && (
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded">
                    Primary
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.is_primary && (
                    <Button size="sm" variant="secondary" onClick={() => setPrimary.mutate(img.id)}>
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => setToDelete(img)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete image?"
        description="This photo will be permanently removed."
        confirmLabel="Delete"
        onConfirm={async () => { if (toDelete) await del.mutateAsync(toDelete); setToDelete(null); }}
      />
    </Card>
  );
}