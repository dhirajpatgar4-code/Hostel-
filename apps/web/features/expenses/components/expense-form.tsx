"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoGallery } from "@/components/photo-gallery";
import { useRoomsWithOccupancy } from "@/features/rooms/hooks";
import { useExpenseCategories, useCreateExpense, useUpdateExpense } from "../hooks";
import type { ExpenseWithRelations } from "../types";
import type { PhotoMeta } from "@/lib/photos";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  editing: ExpenseWithRelations | null;
};

export function ExpenseFormDialog({ open, onOpenChange, propertyId, editing }: Props) {
  const { data: rooms = [] } = useRoomsWithOccupancy(propertyId);
  const { data: categories = [] } = useExpenseCategories(propertyId);
  const create = useCreateExpense(propertyId);
  const update = useUpdateExpense(propertyId);

  const [roomId, setRoomId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<"cash" | "upi" | "bank_transfer" | "card" | "other">("cash");
  const [paidTo, setPaidTo] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PhotoMeta[]>([]);

  useEffect(() => {
    if (!open) return;
    setRoomId(editing?.room_id ?? "");
    setCategoryId(editing?.category_id ?? "");
    setDescription(editing?.description ?? "");
    setAmount(editing ? String(editing.amount) : "");
    setDate(editing?.expense_date ?? new Date().toISOString().slice(0, 10));
    setMethod((editing?.payment_method as any) ?? "cash");
    setPaidTo(editing?.paid_to ?? "");
    setNotes(editing?.notes ?? "");
    setPhotos(Array.isArray((editing as any)?.photos) ? (editing as any).photos : []);
  }, [open, editing?.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    const payload: any = {
      property_id: propertyId,
      room_id: roomId || null,
      category_id: categoryId || null,
      description: description || null,
      amount: Number(amount),
      expense_date: date,
      payment_method: method,
      paid_to: paidTo || null,
      notes: notes || null,
      photos,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  const canSave = !!amount && !create.isPending && !update.isPending;
  const scope = editing ? `expenses/${editing.id}` : `expenses/draft-${Date.now()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Amount (₹) *</Label>
              <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category</Label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Room (optional)</Label>
              <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Hostel-wide</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.room_number}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Fan repair" />
          </div>

          <PhotoGallery
            photos={photos}
            onChange={setPhotos}
            propertyId={propertyId}
            scope={scope}
            label="Bill / Receipt Photos"
            max={5}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Paid To</Label>
              <Input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder="Person / Vendor" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!canSave}>
              {create.isPending || update.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
