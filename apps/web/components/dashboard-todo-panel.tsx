"use client";
import { useState } from "react";
import Link from "next/link";
import { X, Bell, ListChecks, CreditCard, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";

export function DashboardTodoPanel({
  propertyId,
}: {
  propertyId: string;
}) {
  const [open, setOpen] = useState(true);

  const { data } = useQuery({
    queryKey: ["dashboard-todo", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const sb = createClient();

      const [rents, tasks, bills] = await Promise.all([
        sb.from("rent_records")
          .select("id, tenant_id, month, year, rent_amount, pending_amount, due_date, status, tenants!inner(full_name, property_id)")
          .eq("tenants.property_id", propertyId)
          .in("status", ["pending", "partial", "overdue"])
          .order("due_date", { ascending: true })
          .limit(8),
        sb.from("maintenance_tasks")
          .select("id, title, priority, due_date, status")
          .eq("property_id", propertyId)
          .in("status", ["pending", "in_progress"])
          .order("due_date", { ascending: true })
          .limit(8),
        sb.from("electricity_bills")
          .select("id, room_id, billing_month, billing_year, bill_amount, status, rooms!inner(room_number, property_id)")
          .eq("rooms.property_id", propertyId)
          .in("status", ["pending", "overdue", "photo_pending"])
          .order("billing_year", { ascending: false })
          .limit(8),
      ]);

      const rentDues = (rents.data ?? []) as any[];
      const openTasks = (tasks.data ?? []) as any[];
      const pendingBills = (bills.data ?? []) as any[];

      return {
        rentDues: rentDues.map((r) => ({
          id: r.id,
          label: `${r.tenants?.full_name ?? "Tenant"} owes ${formatCurrency(r.pending_amount)}`,
          sub: `Due ${formatDate(r.due_date)} · ${r.status}`,
        })),
        tasks: openTasks.map((t) => ({
          id: t.id,
          label: t.title,
          sub: `${t.priority}${t.due_date ? " · due " + formatDate(t.due_date) : ""}`,
        })),
        bills: pendingBills.map((b) => ({
          id: b.id,
          label: `Room ${b.rooms?.room_number ?? "—"} electricity ${formatCurrency(b.bill_amount)}`,
          sub: `${b.status} · ${b.billing_month}/${b.billing_year}`,
        })),
      };
    },
    staleTime: 60_000,
  });

  const rentCount = data?.rentDues.length ?? 0;
  const taskCount = data?.tasks.length ?? 0;
  const billCount = data?.bills.length ?? 0;
  const total = rentCount + taskCount + billCount;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed top-20 right-4 z-40 rounded-full bg-primary text-primary-foreground h-12 w-12 shadow-lg flex items-center justify-center relative"
        aria-label="Open todo list"
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center font-medium">
            {total}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-background shadow-xl">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Todo</span>
          {total > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs rounded-full h-5 px-2 flex items-center">
              {total}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto p-2 space-y-3">
        {rentCount > 0 && (
          <Section
            icon={CreditCard}
            title={`Rent dues (${rentCount})`}
            items={data!.rentDues}
            href="/payments"
          />
        )}
        {billCount > 0 && (
          <Section
            icon={Zap}
            title={`Electricity (${billCount})`}
            items={data!.bills}
            href="/electricity"
          />
        )}
        {taskCount > 0 && (
          <Section
            icon={ListChecks}
            title={`Tasks (${taskCount})`}
            items={data!.tasks}
            href="/tasks"
          />
        )}
        {total === 0 && (
          <div className="p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium">All clear</p>
            <p className="text-xs text-muted-foreground">No pending dues or tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  icon: Icon, title, items, href,
}: {
  icon: any;
  title: string;
  items: { id: string; label: string; sub: string }[];
  href: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-2 mb-1">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          <span>{title}</span>
        </div>
        <Link href={href} className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-1">
        {items.map((it) => (
          <div key={it.id} className="rounded-md border bg-muted/20 p-2">
            <div className="text-sm font-medium truncate">{it.label}</div>
            <div className="text-xs text-muted-foreground truncate">{it.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
