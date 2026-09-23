"use client";
import { useState } from "react";
import Link from "next/link";
import { X, Bell, ListChecks, CreditCard, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";

export function DashboardTodoPanel({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);

  const { data } = useQuery({
    queryKey: ["dashboard-todo", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const sb = createClient();
      const [rents, tasks, bills] = await Promise.all([
        sb.from("rent_records")
          .select("id, pending_amount, due_date, status, tenants!inner(full_name, property_id)")
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
          .select("id, bill_amount, status, rooms!inner(room_number, property_id)")
          .eq("rooms.property_id", propertyId)
          .in("status", ["pending", "overdue", "photo_pending"])
          .limit(8),
      ]);

      return {
        rentDues: ((rents.data ?? []) as any[]).map((r) => ({
          id: r.id,
          label: `${r.tenants?.full_name ?? "Tenant"} owes ${formatCurrency(r.pending_amount)}`,
          sub: `Due ${formatDate(r.due_date)} · ${r.status}`,
        })),
        tasks: ((tasks.data ?? []) as any[]).map((t) => ({
          id: t.id,
          label: t.title,
          sub: `${t.priority}${t.due_date ? " · due " + formatDate(t.due_date) : ""}`,
        })),
        bills: ((bills.data ?? []) as any[]).map((b) => ({
          id: b.id,
          label: `Room ${b.rooms?.room_number ?? "—"} electricity ${formatCurrency(b.bill_amount)}`,
          sub: `${b.status}`,
        })),
      };
    },
    staleTime: 60_000,
  });

  const rentCount = data?.rentDues.length ?? 0;
  const taskCount = data?.tasks.length ?? 0;
  const billCount = data?.bills.length ?? 0;
  const total = rentCount + taskCount + billCount;

  // Auto-open on desktop only, once
  if (!autoOpened && typeof window !== "undefined" && window.innerWidth >= 768 && total > 0) {
    setAutoOpened(true);
    setOpen(true);
  }

  // Floating badge button — position differs per screen size
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 rounded-full bg-primary text-primary-foreground h-12 w-12 shadow-lg flex items-center justify-center bottom-20 right-4 md:top-20 md:bottom-auto md:right-4"
        aria-label="Open todo list"
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center font-medium">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      {/* Desktop: floating panel */}
      <div className="hidden md:block fixed top-20 right-4 z-40 w-80 rounded-lg border bg-background shadow-xl">
        <PanelContent
          onClose={() => setOpen(false)}
          rentCount={rentCount}
          billCount={billCount}
          taskCount={taskCount}
          total={total}
          data={data}
        />
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden fixed inset-0 z-50 flex items-end">
        <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
        <div className="relative w-full max-h-[80vh] bg-background rounded-t-2xl shadow-xl flex flex-col">
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <PanelContent
            onClose={() => setOpen(false)}
            rentCount={rentCount}
            billCount={billCount}
            taskCount={taskCount}
            total={total}
            data={data}
            isMobile
          />
        </div>
      </div>
    </>
  );
}

function PanelContent({
  onClose,
  rentCount,
  billCount,
  taskCount,
  total,
  data,
  isMobile,
}: {
  onClose: () => void;
  rentCount: number;
  billCount: number;
  taskCount: number;
  total: number;
  data: any;
  isMobile?: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between p-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Todo</span>
          {total > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs rounded-full h-5 px-2 flex items-center">
              {total}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className={`overflow-y-auto p-2 space-y-3 ${isMobile ? "pb-6" : "max-h-96"}`}>
        {rentCount > 0 && (
          <Section icon={CreditCard} title={`Rent dues (${rentCount})`} items={data.rentDues} href="/payments" />
        )}
        {billCount > 0 && (
          <Section icon={Zap} title={`Electricity (${billCount})`} items={data.bills} href="/electricity" />
        )}
        {taskCount > 0 && (
          <Section icon={ListChecks} title={`Tasks (${taskCount})`} items={data.tasks} href="/tasks" />
        )}
        {total === 0 && (
          <div className="p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium">All clear</p>
            <p className="text-xs text-muted-foreground">No pending dues or tasks</p>
          </div>
        )}
      </div>
    </>
  );
}

function Section({
  icon: Icon,
  title,
  items,
  href,
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
