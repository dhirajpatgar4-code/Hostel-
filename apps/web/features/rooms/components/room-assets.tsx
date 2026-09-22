"use client";
import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRoomAssets, useCreateRoomAsset, useUpdateRoomAsset, useDeleteRoomAsset } from "../hooks";
import type { RoomAsset } from "../types";

const CONDITIONS = ["Good", "Fair", "Poor", "Broken"] as const;
const STATUSES = ["Working", "Broken", "Replaced"] as const;

type AssetFormValues = {
  asset_name: string;
  quantity: number;
  condition: RoomAsset["condition"];
  status: RoomAsset["status"];
  purchase_date: string | null;
  notes: string | null;
};

export function RoomAssets({ roomId }: { roomId: string }) {
  const { data: assets = [], isLoading } = useRoomAssets(roomId);
  const create = useCreateRoomAsset(roomId);
  const update = useUpdateRoomAsset(roomId);
  const del = useDeleteRoomAsset(roomId);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoomAsset | null>(null);
  const [toDelete, setToDelete] = useState<RoomAsset | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(a: RoomAsset) {
    setEditing(a);
    setOpen(true);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Room Assets</CardTitle>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Add Asset
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : !assets.length ? (
          <EmptyState
            title="No assets recorded"
            description="Track beds, fans, geysers, and other items in this room."
            action={
              <Button size="sm" onClick={openNew}>
                <Plus className="h-4 w-4 mr-1" /> Add Asset
              </Button>
            }
          />
        ) : (
          <div className="divide-y">
            {assets.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">
                    {a.asset_name} <span className="text-muted-foreground">× {a.quantity}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <StatusBadge value={a.condition} />
                    <StatusBadge value={a.status} />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setToDelete(a)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Asset" : "Add Asset"}</DialogTitle>
          </DialogHeader>
          <AssetForm
            initial={editing}
            loading={create.isPending || update.isPending}
            onCancel={() => setOpen(false)}
            onSubmit={async (v: AssetFormValues) => {
              if (editing) {
                await update.mutateAsync({ id: editing.id, patch: v });
              } else {
                await create.mutateAsync({
                  room_id: roomId,
                  asset_name: v.asset_name,
                  quantity: v.quantity,
                  condition: v.condition,
                  status: v.status,
                  purchase_date: v.purchase_date,
                  notes: v.notes,
                  photo_url: null,
                });
              }
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete asset?"
        description={`This will remove "${toDelete?.asset_name}" from this room.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (toDelete) await del.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </Card>
  );
}

function AssetForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial: RoomAsset | null;
  onSubmit: (v: AssetFormValues) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [assetName, setAssetName] = useState(initial?.asset_name ?? "");
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [condition, setCondition] = useState<RoomAsset["condition"]>(initial?.condition ?? "Good");
  const [status, setStatus] = useState<RoomAsset["status"]>(initial?.status ?? "Working");
  const [purchaseDate, setPurchaseDate] = useState<string>(initial?.purchase_date ?? "");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          asset_name: assetName,
          quantity,
          condition,
          status,
          purchase_date: purchaseDate || null,
          notes: notes || null,
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Asset Name *</Label>
          <Input
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="Bed / Fan / Geyser"
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Quantity</Label>
          <Input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Condition</Label>
          <Select value={condition} onValueChange={(v) => setCondition(v as RoomAsset["condition"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as RoomAsset["status"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Purchase Date</Label>
        <Input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
