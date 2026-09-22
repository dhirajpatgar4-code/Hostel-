"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenants } from "@/features/tenants/hooks";
import { useCreatePayment } from "../hooks";
import type { PaymentMethod } from "../types";

const METHODS: PaymentMethod[] = ["cash", "upi", "bank_transfer", "card", "other"];
const LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  card: "Card",
  other: "Other",
};

export function PaymentFormDialog({
  open,
  onOpenChange,
  propertyId,
  presetTenantId,
  presetRentRecordId,
  presetRoomId,
  presetAmount,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  presetTenantId?: string;
  presetRentRecordId?: string;
  presetRoomId?: string;
  presetAmount?: number;
}) {
  const { data: tenants = [] } = useTenants(propertyId);
  const create = useCreatePayment(propertyId);

  const [tenantId, setTenantId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setTenantId(presetTenantId ?? "");
      setAmount(presetAmount != null ? String(presetAmount) : "");
      setDate(new Date().toISOString().slice(0, 10));
      setMethod("cash");
      setRef("");
      setNotes("");
    }
  }, [open, presetTenantId, presetAmount]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId || !amount) return;
    await create.mutateAsync({
      tenant_id: tenantId,
      rent_record_id: presetRentRecordId ?? null,
      room_id: presetRoomId ?? null,
      amount: Number(amount),
      payment_date: date,
      payment_method: method,
      transaction_ref: ref || null,
      notes: notes || null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!presetTenantId && (
            <div className="space-y-1">
              <Label>Tenant *</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Payment Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Method *</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Transaction Reference</Label>
            <Input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="UPI txn ID / cheque number"
            />
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!tenantId || !amount || create.isPending}>
              {create.isPending ? "Saving…" : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}