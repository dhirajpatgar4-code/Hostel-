"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useExpenses, useDeleteExpense } from "@/features/expenses/hooks";
import { ExpenseFormDialog } from "@/features/expenses/components/expense-form";
import { formatCurrency, formatDate, monthName } from "@/lib/utils";
import type { ExpenseWithRelations } from "@/features/expenses/types";

export function RoomExpenses({ roomId, propertyId }: { roomId: string; propertyId: string }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithRelations | null>(null);

  const { data: expenses = [], isLoading } = useExpenses(propertyId, { roomId, month, year });
  const del = useDeleteExpense(propertyId);

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Room Expenses</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Total {monthName(month)} {year}: <span className="font-medium text-foreground">{formatCurrency(total)}</span>
          </p>
        </div>
        <div className="flex gap-2">
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
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : !expenses.length ? (
          <EmptyState
            title="No expenses for this period"
            description="Track room-specific costs here."
            action={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Expense
            </Button>}
          />
        ) : (
          <div className="divide-y">
            {expenses.map((e) => (
              <div key={e.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{formatCurrency(e.amount)} — {e.category_name ?? "Uncategorized"}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(e.expense_date)} {e.description ? `· ${e.description}` : ""}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(e); setOpen(true); }}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(e.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ExpenseFormDialog open={open} onOpenChange={setOpen} propertyId={propertyId} editing={editing} />
    </Card>
  );
}
