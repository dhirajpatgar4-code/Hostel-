"use client";
import { useState } from "react";
import { IndianRupee, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useRentRecords } from "../hooks";
import { PaymentFormDialog } from "./payment-form";
import { monthName, formatDate, formatCurrency } from "@/lib/utils";
import type { RentRecordWithTenant } from "../types";

export function RentRecordList({ propertyId }: { propertyId: string }) {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [payOpen, setPayOpen] = useState(false);
  const [selected, setSelected] = useState<RentRecordWithTenant | null>(null);

  const { data: rents = [], isLoading } = useRentRecords(
    propertyId,
    statusFilter ? { status: statusFilter } : undefined
  );

  const columns: Column<RentRecordWithTenant>[] = [
    { key: "tenant", header: "Tenant", cell: (r) => <span className="font-medium">{r.tenant_name}</span> },
    { key: "room", header: "Room", cell: (r) => r.room_number ?? "—" },
    { key: "period", header: "Period", cell: (r) => `${monthName(r.month)} ${r.year}` },
    { key: "amount", header: "Rent", cell: (r) => formatCurrency(r.rent_amount) },
    { key: "paid", header: "Paid", cell: (r) => formatCurrency(r.paid_amount) },
    { key: "pending", header: "Pending", cell: (r) => formatCurrency(r.pending_amount) },
    { key: "due", header: "Due", cell: (r) => formatDate(r.due_date) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelected(r);
            setPayOpen(true);
          }}
          disabled={r.status === "paid"}
        >
          <IndianRupee className="h-3.5 w-3.5 mr-1" /> Pay
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle>Rent Records</CardTitle>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
            <Button size="sm" onClick={() => { setSelected(null); setPayOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Record Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
            </div>
          ) : !rents.length ? (
            <EmptyState
              title="No rent records"
              description="Generate monthly rent for your active tenants."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rents}
              pageSize={15}
              emptyState={<EmptyState title="No rent records match" />}
            />
          )}
        </CardContent>
      </Card>

      <PaymentFormDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        propertyId={propertyId}
        presetTenantId={selected?.tenant_id}
        presetRentRecordId={selected?.id}
        presetAmount={selected?.pending_amount}
      />
    </>
  );
}