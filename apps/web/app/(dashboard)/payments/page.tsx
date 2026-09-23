"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useProperty } from "@/features/properties/hooks";
import {
  useRentRecords, usePayments, useGenerateMonthlyRent, useRevenueSummary,
} from "@/features/payments/hooks";
import { RentRecordList } from "@/features/payments/components/rent-record-list";
import { PaymentFormDialog } from "@/features/payments/components/payment-form";
import { formatCurrency, formatDate, monthName } from "@/lib/utils";
import type { PaymentWithRelations } from "@/features/payments/types";

export default function PaymentsPage() {
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [genOpen, setGenOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const summary = useRevenueSummary(propertyId, { month, year });
  const { data: payments = [], isLoading: loadingPayments } = usePayments(propertyId);
  const generate = useGenerateMonthlyRent(propertyId);

  const payColumns: Column<PaymentWithRelations>[] = [
    { key: "date", header: "Date", cell: (p) => formatDate(p.payment_date) },
    { key: "tenant", header: "Tenant", cell: (p) => <span className="font-medium">{p.tenant_name}</span> },
    { key: "room", header: "Room", cell: (p) => p.room_number ?? "—" },
    { key: "period", header: "Period", cell: (p) => p.month && p.year ? `${monthName(p.month)} ${p.year}` : "—" },
    { key: "amount", header: "Amount", cell: (p) => formatCurrency(p.amount) },
    { key: "method", header: "Method", cell: (p) => <span className="capitalize">{p.payment_method.replace("_", " ")}</span> },
    { key: "ref", header: "Reference", cell: (p) => p.transaction_ref ?? "—" },
  ];

  if (!propertyId) {
  return (
    <div className="space-y-4">
      <EmptyState
        title="Loading property…"
        description="If this persists, your session may be out of date. Try the button below."
      />
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </div>
  );
}
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Payments & Rent</h1>
          <p className="text-sm text-muted-foreground">Track rent, payments and deposits</p>
        </div>
        <div className="flex gap-2">
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
          <Button variant="outline" onClick={() => setGenOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1" /> Generate Rent
          </Button>
          <Button onClick={() => setPayOpen(true)}>Record Payment</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Expected Rent" value={formatCurrency(summary.data?.rentExpected ?? 0)} />
        <SummaryCard label="Collected Rent" value={formatCurrency(summary.data?.rentCollected ?? 0)} tone="success" />
        <SummaryCard label="Pending Rent" value={formatCurrency(summary.data?.rentPending ?? 0)} tone="warning" />
        <SummaryCard label="Elec. Pending" value={formatCurrency(summary.data?.electricityPending ?? 0)} tone="destructive" />
      </div>

      <Tabs defaultValue="rents">
        <TabsList>
          <TabsTrigger value="rents">Rent Records</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="rents">
          <RentRecordList propertyId={propertyId} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
              ) : !payments.length ? (
                <EmptyState title="No payments recorded" />
              ) : (
                <DataTable
                  columns={payColumns}
                  rows={payments}
                  pageSize={15}
                  emptyState={<EmptyState title="No payments" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate rent dialog */}
      {genOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60" onClick={() => setGenOpen(false)}>
          <div className="bg-background rounded-lg p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Generate Rent for {monthName(month)} {year}</h3>
            <p className="text-sm text-muted-foreground">
              This will create rent records for all active allocations for {monthName(month)} {year}.
              Existing records won't be overwritten.
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

      <PaymentFormDialog open={payOpen} onOpenChange={setPayOpen} propertyId={propertyId} />
    </div>
  );
}

function SummaryCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" | "destructive" }) {
  const colorClass =
    tone === "success" ? "text-green-600" :
    tone === "warning" ? "text-amber-600" :
    tone === "destructive" ? "text-destructive" : "";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-xl sm:text-2xl font-semibold ${colorClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}