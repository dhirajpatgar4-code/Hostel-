"use client";
import { useState } from "react";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useProperty } from "@/features/properties/hooks";
import { useRoomsWithOccupancy } from "@/features/rooms/hooks";
import {
  useInventory, useCreateInventoryItem, useUpdateInventoryItem,
  useDeleteInventoryItem, useInventorySummary,
} from "@/features/expenses/hooks";
import type { InventoryItemWithRoom } from "@/features/expenses/types";

const CONDITIONS = ["Good", "Fair", "Poor", "Broken"] as const;
const STATUSES = ["available", "allocated", "broken", "retired"] as const;

export default function InventoryPage() {
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const { data: items = [], isLoading } = useInventory(propertyId);
  const summary = useInventorySummary(propertyId);
  const del = useDeleteInventoryItem(propertyId);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItemWithRoom | null>(null);
  const [toDelete, setToDelete] = useState<InventoryItemWithRoom | null>(null);
  const [search, setSearch] = useState("");

  const filtered = items.filter(
    (i) =>
      i.item_type.toLowerCase().includes(search.toLowerCase()) ||
      (i.identifier ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (i.room_number ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<InventoryItemWithRoom>[] = [
    { key: "type", header: "Item", cell: (i) => <span className="font-medium">{i.item_type}</span> },
    { key: "id", header: "Identifier", cell: (i) => i.identifier ?? "—" },
    { key: "room", header: "Room", cell: (i) => i.room_number ?? "—" },
    { key: "condition", header: "Condition", cell: (i) => <StatusBadge value={i.condition} /> },
    { key: "status", header: "Status", cell: (i) => <StatusBadge value={i.status === "available" ? "available" : i.status} /> },
    {
      key: "actions",
      header: "",
      cell: (i) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(i); setOpen(true); }}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setToDelete(i)}>Delete</Button>
        </div>
      ),
    },
  ];

  if (!propertyId) return <div className="text-muted-foreground">Loading property…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Track chairs, beds, and other items</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="Total" value={summary.data?.total ?? 0} />
        <SummaryCard label="Available" value={summary.data?.available ?? 0} tone="success" />
        <SummaryCard label="Allocated" value={summary.data?.allocated ?? 0} tone="info" />
        <SummaryCard label="Broken" value={summary.data?.broken ?? 0} tone="destructive" />
        <SummaryCard label="Retired" value={summary.data?.retired ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <Input
            placeholder="Search by item, identifier, or room…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : !filtered.length ? (
            <EmptyState
              icon={Package}
              title={search ? "No items match" : "No inventory items"}
              description={search ? "Try another keyword." : "Add chairs, beds and other items to track allocation."}
              action={
                !search && (
                  <Button onClick={() => { setEditing(null); setOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                )
              }
            />
          ) : (
            <DataTable columns={columns} rows={filtered} pageSize={20} emptyState={<EmptyState title="No items" />} />
          )}
        </CardContent>
      </Card>

      <InventoryFormDialog
        open={open}
        onOpenChange={setOpen}
        propertyId={propertyId}
        editing={editing}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete?.item_type}?`}
        description="This item will be removed permanently."
        confirmLabel="Delete"
        onConfirm={async () => { if (toDelete) await del.mutateAsync(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}

function SummaryCard({
  label, value, tone = "default",
}: { label: string; value: number; tone?: "default" | "success" | "info" | "destructive" }) {
  const cls =
    tone === "success" ? "text-green-600" :
    tone === "info" ? "text-blue-600" :
    tone === "destructive" ? "text-destructive" : "";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function InventoryFormDialog({
  open, onOpenChange, propertyId, editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  editing: InventoryItemWithRoom | null;
}) {
  const { data: rooms = [] } = useRoomsWithOccupancy(propertyId);
  const create = useCreateInventoryItem(propertyId);
  const update = useUpdateInventoryItem(propertyId);

  const [itemType, setItemType] = useState(editing?.item_type ?? "");
  const [identifier, setIdentifier] = useState(editing?.identifier ?? "");
  const [condition, setCondition] = useState<typeof CONDITIONS[number]>(editing?.condition ?? "Good");
  const [status, setStatus] = useState<typeof STATUSES[number]>(editing?.status ?? "available");
  const [roomId, setRoomId] = useState(editing?.room_id ?? "");

  // Reset when the dialog opens with a new item
  // Using a ref-like keyed approach: parent should pass key={editing?.id ?? "new"}
  useState(() => {
    if (open) {
      setItemType(editing?.item_type ?? "");
      setIdentifier(editing?.identifier ?? "");
      setCondition(editing?.condition ?? "Good");
      setStatus(editing?.status ?? "available");
      setRoomId(editing?.room_id ?? "");
    }
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemType) return;
    const payload = {
      property_id: propertyId,
      item_type: itemType,
      identifier: identifier || null,
      condition,
      status,
      room_id: roomId || null,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Item Type *</Label>
            <Input
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              placeholder="Chair / Bed / Table"
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Identifier (optional)</Label>
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="C102"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Condition</Label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Room (optional)</Label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Unallocated</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.room_number}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!itemType || create.isPending || update.isPending}>
              {create.isPending || update.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
