"use client";
import { useState } from "react";
import { Plus, Receipt, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useProperty } from "@/features/properties/hooks";
import {
  useExpenses, useDeleteExpense, useExpenseSummary,
  useExpenseCategories, useCreateExpenseCategory, useDeleteExpenseCategory,
} from "@/features/expenses/hooks";
import { ExpenseFormDialog } from "@/features/expenses/components/expense-form";
import { useRoomsWithOccupancy } from "@/features/rooms/hooks";
import { formatCurrency, formatDate, monthName } from "@/lib/utils";
import type { ExpenseWithRelations } from "@/features/expenses/types";

export default function ExpensesPage() {
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [roomFilter, setRoomFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithRelations | null>(null);
  const [toDelete, setToDelete] = useState<ExpenseWithRelations | null>(null);
  const [catOpen, setCatOpen] = useState(false);

  const { data: rooms = [] } = useRoomsWithOccupancy(propertyId);
  const { data: categories = [] } = useExpenseCategories(propertyId);
  const { data: expenses = [], isLoading } = useExpenses(propertyId, {
    month, year,
    roomId: roomFilter || undefined,
    categoryId: categoryFilter || undefined,
  });
  const summary = useExpenseSummary(propertyId, { month, year });
  const del = useDeleteExpense(propertyId);

  const columns: Column<ExpenseWithRelations>[] = [
    { key: "date", header: "Date", cell: (e) => formatDate(e.expense_date) },
    { key: "category", header: "Category", cell: (e) => e.category_name ?? "Uncategorized" },
    { key: "room", header: "Room", cell: (e) => e.room_number ?? "Hostel-wide" },
    { key: "description", header: "Description", cell: (e) => e.description ?? "—" },
    { key: "amount", header: "Amount", cell: (e) => formatCurrency(e.amount) },
    { key: "method", header: "Method", cell: (e) => e.payment_method.replace("_", " ") },
    { key: "paidTo", header: "Paid To", cell: (e) => e.paid_to ?? "—" },
    {
      key: "actions",
      header: "",
      cell: (e) => (
        <div className="flex gap-1" onClick={(ev) => ev.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(e); setFormOpen(true); }}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setToDelete(e)}>Delete</Button>
        </div>
      ),
    },
  ];

  const byCategory = summary.data?.byCategory ?? {};

  if (!propertyId) return <div className="text-muted-foreground">Loading property…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track all hostel and room expenses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCatOpen(true)}>
            <Settings className="h-4 w-4 mr-1" /> Categories
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total — {monthName(month)} {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-semibold text-destructive">
              {formatCurrency(summary.data?.total ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(byCategory).length === 0 ? (
              <p className="text-xs text-muted-foreground">No expenses this month</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {Object.entries(byCategory).map(([k, v]) => (
                  <div key={k} className="text-xs">
                    <span className="text-muted-foreground">{k}: </span>
                    <span className="font-medium">{formatCurrency(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{monthName(m)}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Rooms</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.room_number}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : !expenses.length ? (
            <EmptyState
              icon={Receipt}
              title="No expenses"
              description="Record hostel or room-wise expenses to track where money goes."
              action={
                <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Add Expense
                </Button>
              }
            />
          ) : (
            <DataTable columns={columns} rows={expenses} pageSize={20} emptyState={<EmptyState title="No matching expenses" />} />
          )}
        </CardContent>
      </Card>

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} propertyId={propertyId} editing={editing} />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete expense?"
        description="This will permanently remove the expense record."
        confirmLabel="Delete"
        onConfirm={async () => { if (toDelete) await del.mutateAsync(toDelete.id); setToDelete(null); }}
      />

      <CategoryManager
        open={catOpen}
        onOpenChange={setCatOpen}
        propertyId={propertyId}
        categories={categories}
      />
    </div>
  );
}

function CategoryManager({
  open, onOpenChange, propertyId, categories,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  categories: { id: string; name: string; is_system: boolean }[];
}) {
  const create = useCreateExpenseCategory(propertyId);
  const del = useDeleteExpenseCategory(propertyId);
  const [name, setName] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Expense Categories</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" />
            <Button
              onClick={async () => {
                if (!name) return;
                await create.mutateAsync({ property_id: propertyId, name });
                setName("");
              }}
              disabled={!name || create.isPending}
            >
              Add
            </Button>
          </div>
          <div className="divide-y border rounded">
            {categories.map((c) => (
              <div key={c.id} className="flex justify-between items-center p-3">
                <span className="text-sm">
                  {c.name}
                  {c.is_system && <span className="text-xs text-muted-foreground ml-2">(default)</span>}
                </span>
                {!c.is_system && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => del.mutate(c.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
