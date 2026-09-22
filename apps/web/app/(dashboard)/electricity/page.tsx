"use client";
import { useToast } from "@/components/ui/toaster";
import { Sparkles, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProperty } from "@/features/properties/hooks";
import { useRoomsWithOccupancy } from "@/features/rooms/hooks";
import {
  useBills, useElectricitySummary, useGenerateBills,
  useCreateBill, useUpdateBill, useMarkBillPaid, useDeleteBill,
  useUploadBillPhoto,
} from "@/features/electricity/hooks";
import { BillPhotoViewer } from "@/features/electricity/components/bill-photo-viewer";
import { formatCurrency, monthName, formatDate } from "@/lib/utils";
import type { ElectricityBillWithRoom } from "@/features/electricity/types";

export default function ElectricityPage() {
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ElectricityBillWithRoom | null>(null);

  const { data: bills = [], isLoading } = useBills(propertyId, {
    month, year, status: statusFilter || undefined,
  });
  const summary = useElectricitySummary(propertyId, { month, year });
  const generate = useGenerateBills(propertyId);

  const columns: Column<ElectricityBillWithRoom>[] = [
    { key: "room", header: "Room", cell: (b) => <span className="font-medium">{b.room_number}</span> },
    { key: "period", header: "Period", cell: (b) => `${monthName(b.billing_month)} ${b.billing_year}` },
    { key: "amount", header: "Amount", cell: (b) => formatCurrency(b.bill_amount) },
    { key: "due", header: "Due", cell: (b) => b.due_date ? formatDate(b.due_date) : "—" },
    { key: "reading", header: "Reading", cell: (b) => b.meter_reading ?? "—" },
    {
      key: "photo",
      header: "Bill Photo",
      cell: (b) => (
        <BillPhotoViewer
          path={b.bill_photo_url}
          onView={(url) => window.open(url, "_blank", "noopener,noreferrer")}
        />
      ),
    },
    { key: "status", header: "Status", cell: (b) => <StatusBadge value={b.status} /> },
    {
      key: "actions",
      header: "",
      cell: (b) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setEditing(b); setEditOpen(true); }}
          >
            Edit
          </Button>
          {b.status !== "paid" && (
            <MarkPaidButton id={b.id} />
          )}
        </div>
      ),
    },
  ];

  if (!propertyId) return <div className="text-muted-foreground">Loading property…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Electricity</h1>
          <p className="text-sm text-muted-foreground">Track meters, bills and photos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{monthName(m)}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="photo_pending">Photo Pending</option>
          </select>
          <Button variant="outline" onClick={() => setGenOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1" /> Generate
          </Button>
          <Button onClick={() => { setEditing(null); setEditOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Bill
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="This Month Total" value={formatCurrency(summary.data?.totalBills ?? 0)} />
        <SummaryCard label="Collected" value={formatCurrency(summary.data?.totalPaid ?? 0)} tone="success" />
        <SummaryCard label="Pending" value={formatCurrency(summary.data?.totalPending ?? 0)} tone="warning" />
        <SummaryCard label="Photos Missing" value={String(summary.data?.photoPending ?? 0)} tone="destructive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bills — {monthName(month)} {year}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : !bills.length ? (
            <EmptyState
              title="No bills for this period"
              description="Click Generate to create placeholders for all rooms, or add a bill manually."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={bills}
              pageSize={20}
              emptyState={<EmptyState title="No bills match" />}
            />
          )}
        </CardContent>
      </Card>

      {/* Generate dialog */}
      {genOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60" onClick={() => setGenOpen(false)}>
          <div className="bg-background rounded-lg p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Generate for {monthName(month)} {year}</h3>
            <p className="text-sm text-muted-foreground">
              Creates a placeholder bill for every active room for this period. Existing bills are untouched.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  await generate.mutateAsync({ month, year });
                  setGenOpen(false);
                }}
                disabled={generate.isPending}
              >
                {generate.isPending ? "Generating…" : "Generate"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <BillEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        propertyId={propertyId}
        bill={editing}
        defaultMonth={month}
        defaultYear={year}
      />
    </div>
  );
}

function SummaryCard({
  label, value, tone = "default",
}: { label: string; value: string; tone?: "default" | "success" | "warning" | "destructive" }) {
  const cls =
    tone === "success" ? "text-green-600" :
    tone === "warning" ? "text-amber-600" :
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

function MarkPaidButton({ id }: { id: string }) {
  const { property } = useProperty();
  const mark = useMarkBillPaid(property?.id ?? "");
  return (
    <Button size="sm" variant="ghost" onClick={() => mark.mutate(id)} disabled={mark.isPending}>
      {mark.isPending ? "…" : "Mark Paid"}
    </Button>
  );
}

// ─── BILL EDIT DIALOG ─────────────────────────────────────

function BillEditDialog({
  open, onOpenChange, propertyId, bill, defaultMonth, defaultYear,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  bill: ElectricityBillWithRoom | null;
  defaultMonth: number;
  defaultYear: number;
}) {
  const { data: rooms = [] } = useRoomsWithOccupancy(propertyId);
  const create = useCreateBill(propertyId);
  const update = useUpdateBill(propertyId);
  const upload = useUploadBillPhoto(propertyId, bill?.room_id ?? "");
  const { success, error: toastErr } = useToast();

  const [roomId, setRoomId] = useState(bill?.room_id ?? "");
  const [month, setMonth] = useState(bill?.billing_month ?? defaultMonth);
  const [year, setYear] = useState(bill?.billing_year ?? defaultYear);
  const [amount, setAmount] = useState(bill ? String(bill.bill_amount) : "");
  const [billDate, setBillDate] = useState(bill?.bill_date ?? "");
  const [dueDate, setDueDate] = useState(bill?.due_date ?? "");
  const [reading, setReading] = useState(bill?.meter_reading != null ? String(bill.meter_reading) : "");
  const [notes, setNotes] = useState(bill?.notes ?? "");
  const [photoPath, setPhotoPath] = useState<string | null>(bill?.bill_photo_url ?? null);

  // Reset when opening
    useEffect(() => {
    if (!open) return;
    setRoomId(bill?.room_id ?? "");
    setMonth(bill?.billing_month ?? defaultMonth);
    setYear(bill?.billing_year ?? defaultYear);
    setAmount(bill ? String(bill.bill_amount) : "");
    setBillDate(bill?.bill_date ?? "");
    setDueDate(bill?.due_date ?? "");
    setReading(bill?.meter_reading != null ? String(bill.meter_reading) : "");
    setNotes(bill?.notes ?? "");
    setPhotoPath(bill?.bill_photo_url ?? null);
  }, [open, bill, defaultMonth, defaultYear]);
  async function handlePhoto(files: FileList | null) {
    if (!files?.[0] || !roomId) {
      if (!roomId) toastErr("Select a room first", "Room is required");
      return;
    }
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) return toastErr("Too large", "Max 10 MB");
    try {
      const path = await upload.mutateAsync(file);
      setPhotoPath(path);
    } catch (e: any) {
      toastErr("Upload failed", e.message);
    }
  }

 async function submit(e: React.FormEvent) {
  e.preventDefault();
  const finalRoomId = roomId || bill?.room_id || "";
  if (!finalRoomId || !amount) return;
  const payload = {
    room_id: finalRoomId,
    billing_month: month,
    billing_year: year,
    bill_amount: Number(amount),
    bill_date: billDate || null,
    due_date: dueDate || null,
    meter_reading: reading ? Number(reading) : null,
    bill_photo_url: photoPath,
    notes: notes || null,
  };
  if (bill) {
    await update.mutateAsync({ id: bill.id, patch: payload });
  } else {
    await create.mutateAsync(payload);
  }
  onOpenChange(false);
}


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{bill ? `Edit Bill — Room ${bill.room_number}` : "Add Bill"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!bill && (
            <div className="space-y-1">
              <Label>Room *</Label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">Select room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.room_number}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Month *</Label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{monthName(m)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Year *</Label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Bill Amount (₹) *</Label>
              <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Meter Reading</Label>
              <Input type="number" min={0} step="0.01" value={reading} onChange={(e) => setReading(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Bill Date</Label>
              <Input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bill Photo</Label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhoto(e.target.files)}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
            />
            {photoPath && <p className="text-xs text-muted-foreground">Photo uploaded ✓</p>}
            {upload.isPending && <p className="text-xs text-muted-foreground">Uploading…</p>}
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
  type="submit"
  disabled={(!bill && !roomId) || !amount || create.isPending || update.isPending}
></Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Avoid an unused import warning
