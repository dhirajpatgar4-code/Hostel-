"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoomsWithOccupancy } from "@/features/rooms/hooks";
import { useTenants, useAllocateTenant } from "../hooks";

export function AllocateTenantDialog({
  open,
  onOpenChange,
  propertyId,
  presetRoomId,
  presetTenantId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  presetRoomId?: string;
  presetTenantId?: string;
}) {
  const { data: tenants = [] } = useTenants(propertyId);
  const { data: rooms = [] } = useRoomsWithOccupancy(propertyId);
  const allocate = useAllocateTenant(propertyId);

  const [tenantId, setTenantId] = useState<string>(presetTenantId ?? "");
  const [roomId, setRoomId] = useState<string>(presetRoomId ?? "");
  const [allocationDate, setAllocationDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [rent, setRent] = useState<string>("");
  const [deposit, setDeposit] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (open) {
      setTenantId(presetTenantId ?? "");
      setRoomId(presetRoomId ?? "");
      setAllocationDate(new Date().toISOString().slice(0, 10));
      setRent("");
      setDeposit("");
      setNotes("");
    }
  }, [open, presetRoomId, presetTenantId]);

  // Auto-fill rent/deposit when a tenant is selected
  useEffect(() => {
    if (!tenantId) return;
    const t = tenants.find((x) => x.id === tenantId);
    if (t) {
      if (!rent) setRent(String(t.monthly_rent));
      if (!deposit) setDeposit(String(t.security_deposit));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId || !roomId) return;
    await allocate.mutateAsync({
      tenant_id: tenantId,
      room_id: roomId,
      allocation_date: allocationDate,
      rent_amount: Number(rent || 0),
      deposit_amount: Number(deposit || 0),
      notes: notes || null,
    });
    onOpenChange(false);
  }

  const availableRooms = rooms.filter((r) => r.occupied < r.capacity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Allocate Tenant to Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Tenant *</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}{t.current_room_number ? ` (currently ${t.current_room_number})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Room *</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
              <SelectContent>
                {availableRooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.room_number} — {r.occupied}/{r.capacity} occupied
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!availableRooms.length && (
              <p className="text-xs text-muted-foreground">No rooms with free space.</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Allocation Date *</Label>
            <Input type="date" value={allocationDate} onChange={(e) => setAllocationDate(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Monthly Rent (₹)</Label>
              <Input type="number" min={0} step="0.01" value={rent} onChange={(e) => setRent(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Security Deposit (₹)</Label>
              <Input type="number" min={0} step="0.01" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!tenantId || !roomId || allocate.isPending}>
              {allocate.isPending ? "Allocating…" : "Allocate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}