"use client";
import { useEffect, useRef, useState } from "react";
import {
  Building2, Upload, Pencil, TrendingDown, TrendingUp, Eye, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import {
  useBuildingBill, useElectricityComparison,
  useUpsertBuildingBill, useUploadBuildingBillPhoto,
} from "../hooks";
import { getBuildingBillPhotoSignedUrl } from "../api";
import { formatCurrency, monthName, formatDate } from "@/lib/utils";

export function BuildingBillCard({
  propertyId,
  month,
  year,
}: {
  propertyId: string;
  month: number;
  year: number;
}) {
  const { data: comparison } = useElectricityComparison(propertyId, month, year);
  const { data: building } = useBuildingBill(propertyId, month, year);
  const [editOpen, setEditOpen] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!building?.bill_photo_path) {
      setPhotoUrl(null);
      return;
    }
    getBuildingBillPhotoSignedUrl(building.bill_photo_path)
      .then((u) => { if (alive) setPhotoUrl(u); })
      .catch(() => { if (alive) setPhotoUrl(null); });
    return () => { alive = false; };
  }, [building?.bill_photo_path]);

  const buildingTotal = comparison?.buildingTotal ?? 0;
  const roomTotal = comparison?.roomTotal ?? 0;
  const variance = comparison?.variance ?? 0;
  const hasBill = !!building;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Building Bill
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditOpen(true)}
            className="h-7 px-2"
          >
            {hasBill ? <Pencil className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-semibold">
            {hasBill ? formatCurrency(buildingTotal) : <span className="text-muted-foreground text-base">Not set</span>}
          </div>

          {hasBill && (
            <>
              <div className="text-xs text-muted-foreground">
                {monthName(month)} {year}
                {building?.units_consumed != null && ` · ${building.units_consumed} kWh`}
              </div>

              {/* Comparison line */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Room bills total</span>
                  <span className="font-medium">{formatCurrency(roomTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    {variance > 0 ? (
                      <><TrendingDown className="h-3 w-3 text-destructive" /> Shortfall</>
                    ) : variance < 0 ? (
                      <><TrendingUp className="h-3 w-3 text-green-600" /> Surplus</>
                    ) : (
                      <>Variance</>
                    )}
                  </span>
                  <span
                    className={`font-semibold ${
                      variance > 0
                        ? "text-destructive"
                        : variance < 0
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatCurrency(Math.abs(variance))}
                  </span>
                </div>
              </div>

              {/* Photo thumbnail */}
              {photoUrl && (
                <button
                  onClick={() => window.open(photoUrl, "_blank", "noopener,noreferrer")}
                  className="w-full mt-2 rounded-lg border overflow-hidden aspect-video bg-muted hover:ring-2 hover:ring-primary transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Building bill" className="w-full h-full object-cover" />
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <BuildingBillDialog
        key={`${month}-${year}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        propertyId={propertyId}
        month={month}
        year={year}
        existing={building ?? null}
      />
    </>
  );
}

function BuildingBillDialog({
  open, onOpenChange, propertyId, month, year, existing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  month: number;
  year: number;
  existing: any;
}) {
  const upsert = useUpsertBuildingBill(propertyId);
  const upload = useUploadBuildingBillPhoto(propertyId, month, year);
  const { success, error: toastErr } = useToast();

  const [amount, setAmount] = useState(existing?.bill_amount ? String(existing.bill_amount) : "");
  const [units, setUnits] = useState(existing?.units_consumed != null ? String(existing.units_consumed) : "");
  const [billDate, setBillDate] = useState(existing?.bill_date ?? "");
  const [dueDate, setDueDate] = useState(existing?.due_date ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [photoPath, setPhotoPath] = useState<string | null>(existing?.bill_photo_path ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhoto(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toastErr("Too large", "Max 10 MB");
      return;
    }
    try {
      const path = await upload.mutateAsync(file);
      setPhotoPath(path);
    } catch (e: any) {
      toastErr("Upload failed", e.message);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    await upsert.mutateAsync({
      property_id: propertyId,
      billing_month: month,
      billing_year: year,
      bill_amount: Number(amount),
      units_consumed: units ? Number(units) : null,
      bill_date: billDate || null,
      due_date: dueDate || null,
      bill_photo_path: photoPath,
      notes: notes || null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle>
            Building Bill — {monthName(month)} {year}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-1">
              <Label>Total Bill Amount (₹) *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Whole building electricity bill"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Units Consumed (kWh)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="Optional — from your electricity board bill"
              />
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
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handlePhoto(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileRef.current?.click()}
                loading={upload.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                {photoPath ? "Replace Photo" : "Upload Photo"}
              </Button>
              {photoPath && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Photo uploaded ✓
                  <button
                    type="button"
                    onClick={() => setPhotoPath(null)}
                    className="text-destructive hover:underline ml-1"
                  >
                    Remove
                  </button>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-background shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!amount || upsert.isPending} className="min-w-[100px]">
              {upsert.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
