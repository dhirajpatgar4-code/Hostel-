"use client";
import { useRef, useState } from "react";
import {
  Plus, QrCode, Trash2, Download, Share2, Copy, Upload, X, ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toaster";
import { useProperty } from "@/features/properties/hooks";
import {
  useQRs, useCreateQR, useUpdateQR, useDeleteQR, useUploadQRImage,
} from "@/features/payments/hooks";
import type { PaymentQR } from "@/features/payments/types";

export default function QRCodesPage() {
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const { data: qrs = [], isLoading } = useQRs(propertyId);
  const create = useCreateQR(propertyId);
  const update = useUpdateQR(propertyId);
  const del = useDeleteQR(propertyId);
  const upload = useUploadQRImage(propertyId);
  const { success, error: toastErr } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentQR | null>(null);
  const [toDelete, setToDelete] = useState<PaymentQR | null>(null);
  const [viewingQR, setViewingQR] = useState<PaymentQR | null>(null);

  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function openNew() {
    setEditing(null);
    setName("");
    setUpiId("");
    setImageUrl("");
    setDescription("");
    setOpen(true);
  }

  function openEdit(q: PaymentQR) {
    setEditing(q);
    setName(q.name);
    setUpiId(q.upi_id ?? "");
    setImageUrl(q.qr_image_url ?? "");
    setDescription(q.description ?? "");
    setOpen(true);
  }

  async function handleImageFile(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toastErr("Invalid file", "Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastErr("File too large", "Max 5 MB");
      return;
    }
    try {
      const url = await upload.mutateAsync(file);
      setImageUrl(url);
    } catch (e: any) {
      toastErr("Upload failed", e.message);
    } finally {
      // Reset the input so the same file can be re-picked if needed
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveQR(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    if (editing) {
      await update.mutateAsync({
        id: editing.id,
        patch: {
          name,
          upi_id: upiId || null,
          qr_image_url: imageUrl || null,
          description: description || null,
        },
      });
    } else {
      await create.mutateAsync({
        property_id: propertyId,
        name,
        upi_id: upiId || null,
        qr_image_url: imageUrl || null,
        description: description || null,
        is_active: true,
      });
    }
    setOpen(false);
  }

  async function downloadQR(q: PaymentQR) {
    if (!q.qr_image_url) return toastErr("No image", "This QR has no image to download");
    try {
      const res = await fetch(q.qr_image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${q.name.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      success("Download started");
    } catch (e: any) {
      toastErr("Download failed", e.message);
    }
  }

  function shareWhatsApp(q: PaymentQR) {
    const lines = [`*${q.name}*`];
    if (q.upi_id) lines.push(`UPI ID: ${q.upi_id}`);
    if (q.description) lines.push(q.description);
    if (q.qr_image_url) lines.push(`QR: ${q.qr_image_url}`);
    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  async function copyUpi(q: PaymentQR) {
    if (!q.upi_id) return toastErr("No UPI ID", "Add a UPI ID first");
    try {
      await navigator.clipboard.writeText(q.upi_id);
      success("UPI ID copied");
    } catch {
      toastErr("Copy failed", "Please copy manually");
    }
  }

  async function copyLink(q: PaymentQR) {
    if (!q.qr_image_url) return toastErr("No image", "This QR has no image");
    try {
      await navigator.clipboard.writeText(q.qr_image_url);
      success("Image link copied");
    } catch {
      toastErr("Copy failed", "Please copy manually");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Payment QR Codes</h1>
          <p className="text-sm text-muted-foreground">
            Store UPI QRs for quick display, download and sharing with tenants
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Add QR
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !qrs.length ? (
        <EmptyState
          icon={QrCode}
          title="No QR codes"
          description="Add UPI QRs to display during rent collection or share with tenants."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Add QR
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrs.map((q) => (
            <Card key={q.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">{q.name}</CardTitle>
                  {q.upi_id && (
                    <p className="text-xs text-muted-foreground mt-1 truncate font-mono">
                      {q.upi_id}
                    </p>
                  )}
                </div>
                <StatusBadge value={q.is_active ? "available" : "inactive"} />
              </CardHeader>

              <CardContent className="space-y-3 flex-1 flex flex-col">
                {q.qr_image_url ? (
                  <button
                    type="button"
                    onClick={() => setViewingQR(q)}
                    className="w-full aspect-square bg-white rounded border flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={q.qr_image_url}
                      alt={q.name}
                      className="object-contain w-full h-full"
                    />
                  </button>
                ) : (
                  <div className="w-full aspect-square bg-muted rounded border flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs">No image</span>
                  </div>
                )}

                {q.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {q.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadQR(q)}
                    disabled={!q.qr_image_url}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareWhatsApp(q)}>
                    <Share2 className="h-3.5 w-3.5 mr-1" /> WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyUpi(q)}
                    disabled={!q.upi_id}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> UPI ID
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyLink(q)}
                    disabled={!q.qr_image_url}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Link
                  </Button>
                </div>

                <div className="flex justify-between border-t pt-2 text-xs">
                  <button
                    onClick={() => openEdit(q)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      update.mutate({ id: q.id, patch: { is_active: !q.is_active } })
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {q.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => setToDelete(q)}
                    className="text-destructive hover:opacity-80"
                  >
                    Delete
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── CREATE / EDIT DIALOG ─────────────────────────────
          Uses Radix primitives directly with:
          - onInteractOutside prevented (so file picker won't close it)
          - onOpenAutoFocus prevented (so opening file picker from a
            button doesn't steal focus back)
          This eliminates the "glitch + can't click Save" bug.
      ─────────────────────────────────────────────────────── */}
      {open && (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <DialogPrimitive.Content
              onInteractOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => {
                // Let ESC close only if no file picker pending
                if (upload.isPending) e.preventDefault();
              }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex flex-col space-y-1.5 mb-4">
                <DialogPrimitive.Title className="text-lg font-semibold">
                  {editing ? "Edit QR" : "Add QR"}
                </DialogPrimitive.Title>
              </div>

              {/* File input lives here — INSIDE the content but flagged
                  so Radix keeps the dialog open when the picker opens. */}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: "none" }}
                onChange={(e) => handleImageFile(e.target.files)}
              />

              <form onSubmit={saveQR} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="qr-name">Name *</Label>
                  <Input
                    id="qr-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="UPI Rent QR"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="qr-upi">UPI ID</Label>
                  <Input
                    id="qr-upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                  />
                </div>

                <div className="space-y-2">
                  <Label>QR Image</Label>

                  {imageUrl ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-20 h-20 bg-white rounded border flex items-center justify-center overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt="QR preview"
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{imageUrl}</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => fileRef.current?.click()}
                            disabled={upload.isPending}
                          >
                            <Upload className="h-3.5 w-3.5 mr-1" /> Replace
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setImageUrl("")}
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileRef.current?.click()}
                      disabled={upload.isPending}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {upload.isPending ? "Uploading…" : "Upload QR Image"}
                    </Button>
                  )}

                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      Or paste an image URL
                    </summary>
                    <Input
                      className="mt-2"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </details>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="qr-desc">Description</Label>
                  <Textarea
                    id="qr-desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Scan to pay rent for this month"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!name || create.isPending || update.isPending}
                  >
                    {create.isPending || update.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </form>

              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}

      {/* ── VIEW DIALOG ───────────────────────────────────── */}
      {viewingQR && (
        <DialogPrimitive.Root open={!!viewingQR} onOpenChange={(o) => !o && setViewingQR(null)}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <DialogPrimitive.Content
              onInteractOutside={() => setViewingQR(null)}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg"
            >
              <DialogPrimitive.Title className="text-lg font-semibold mb-4">
                {viewingQR.name}
              </DialogPrimitive.Title>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewingQR.qr_image_url!}
                    alt={viewingQR.name}
                    className="w-full max-w-xs object-contain"
                  />
                </div>
                {viewingQR.upi_id && (
                  <p className="text-sm text-center font-mono">{viewingQR.upi_id}</p>
                )}
                {viewingQR.description && (
                  <p className="text-xs text-center text-muted-foreground">
                    {viewingQR.description}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" onClick={() => downloadQR(viewingQR)}>
                    <Download className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button variant="outline" onClick={() => shareWhatsApp(viewingQR)}>
                    <Share2 className="h-4 w-4 mr-1" /> Share
                  </Button>
                  <Button variant="outline" onClick={() => copyLink(viewingQR)}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
              </div>
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete QR?"
        description="This QR will be removed permanently."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (toDelete) await del.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}
