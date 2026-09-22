"use client";
import { useState } from "react";
import { Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBillsForRoom, useMeter, useUpsertMeter } from "../hooks";
import { BillPhotoViewer } from "./bill-photo-viewer";
import { formatCurrency, monthName, formatDate } from "@/lib/utils";

export function RoomElectricity({
  roomId,
  propertyId,
}: {
  roomId: string;
  propertyId: string;
}) {
  const { data: meter, isLoading: loadingMeter } = useMeter(roomId);
  const { data: bills = [], isLoading: loadingBills } = useBillsForRoom(roomId);
  const upsert = useUpsertMeter(roomId);

  const [consumer, setConsumer] = useState(meter?.consumer_number ?? "");
  const [meterNo, setMeterNo] = useState(meter?.meter_number ?? "");
  const [current, setCurrent] = useState(meter?.current_reading != null ? String(meter.current_reading) : "");
  const [previous, setPrevious] = useState(meter?.previous_reading != null ? String(meter.previous_reading) : "");

  const [editing, setEditing] = useState(false);

  async function saveMeter(e: React.FormEvent) {
    e.preventDefault();
    await upsert.mutateAsync({
      room_id: roomId,
      consumer_number: consumer || null,
      meter_number: meterNo || null,
      current_reading: current ? Number(current) : null,
      previous_reading: previous ? Number(previous) : null,
    });
    setEditing(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Meter Info</CardTitle>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              {meter ? "Edit" : "Add Meter"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingMeter ? (
            <div className="h-20 bg-muted rounded animate-pulse" />
          ) : editing || !meter ? (
            <form onSubmit={saveMeter} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Consumer Number</Label>
                  <Input value={consumer} onChange={(e) => setConsumer(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Meter Number</Label>
                  <Input value={meterNo} onChange={(e) => setMeterNo(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Previous Reading</Label>
                  <Input type="number" step="0.01" value={previous} onChange={(e) => setPrevious(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Current Reading</Label>
                  <Input type="number" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {meter && <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>}
                <Button type="submit" disabled={upsert.isPending}>
                  <Save className="h-4 w-4 mr-1" /> {upsert.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Info label="Consumer No." value={meter.consumer_number ?? "—"} mono />
              <Info label="Meter No." value={meter.meter_number ?? "—"} mono />
              <Info label="Previous" value={meter.previous_reading ?? "—"} />
              <Info label="Current" value={meter.current_reading ?? "—"} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBills ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : !bills.length ? (
            <EmptyState title="No bills yet" description="Bills created from the Electricity page will appear here." />
          ) : (
            <div className="divide-y">
              {bills.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{monthName(b.billing_month)} {b.billing_year}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(b.bill_amount)}
                      {b.due_date ? ` · Due ${formatDate(b.due_date)}` : ""}
                      {b.meter_reading != null ? ` · Reading ${b.meter_reading}` : ""}
                    </div>
                  </div>
                  <BillPhotoViewer path={b.bill_photo_url} />
                  <StatusBadge value={b.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
