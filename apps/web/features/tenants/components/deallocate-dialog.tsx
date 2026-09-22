"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeallocateTenant } from "../hooks";

export function DeallocateDialog({
  open,
  onOpenChange,
  propertyId,
  allocationId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  allocationId: string | null;
}) {
  const dealloc = useDeallocateTenant(propertyId);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allocationId) return;
    await dealloc.mutateAsync({ allocationId, date });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deallocate Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Deallocation Date *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <p className="text-xs text-muted-foreground">
            Historical allocation will be preserved. The tenant record remains available.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={!allocationId || dealloc.isPending}>
              {dealloc.isPending ? "Working…" : "Deallocate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}