"use client";
import { useState } from "react";
import { Plus, ListChecks, Settings, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProperty } from "@/features/properties/hooks";
import {
  useTasks, useDeleteTask, useCompleteTask,
  useTaskCategories, useCreateTaskCategory, useDeleteTaskCategory,
} from "@/features/tasks/hooks";
import { TaskFormDialog } from "@/features/tasks/components/task-form";
import { formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/features/tasks/types";

export default function TasksPage() {
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);
  const [toDelete, setToDelete] = useState<TaskWithRelations | null>(null);
  const [catOpen, setCatOpen] = useState(false);

  const { data: tasks = [], isLoading } = useTasks(propertyId, {
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });
  const complete = useCompleteTask(propertyId);
  const del = useDeleteTask(propertyId);
  const { data: categories = [] } = useTaskCategories(propertyId);

  const filtered = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.assigned_to ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.room_number ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "completed").length,
  };

  if (!propertyId) return <div className="text-muted-foreground">Loading property…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">Maintenance, reminders and to-dos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatOpen(true)}>
            <Settings className="h-4 w-4 mr-1" /> Categories
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Pending" value={counts.pending} tone="warning" />
        <SummaryCard label="In Progress" value={counts.in_progress} tone="info" />
        <SummaryCard label="Completed" value={counts.completed} tone="success" />
        <SummaryCard label="Urgent" value={counts.urgent} tone="destructive" />
      </div>

      <Card>
        <CardHeader className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : !filtered.length ? (
            <EmptyState
              icon={ListChecks}
              title={search ? "No tasks match" : "No tasks yet"}
              description={search ? "Try another keyword." : "Add maintenance tasks and reminders."}
              action={
                !search && (
                  <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Task
                  </Button>
                )
              }
            />
          ) : (
            <div className="divide-y">
              {filtered.map((t) => (
                <div key={t.id} className="py-3 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.title}</span>
                      <StatusBadge value={t.priority} />
                      <StatusBadge value={t.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t.room_number ? `Room ${t.room_number}` : "Hostel-wide"}
                      {t.category_name ? ` · ${t.category_name}` : ""}
                      {t.due_date ? ` · Due ${formatDate(t.due_date)}` : ""}
                      {t.assigned_to ? ` · ${t.assigned_to}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {t.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => complete.mutate(t.id)}
                        disabled={complete.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Done
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(t); setFormOpen(true); }}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setToDelete(t)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} propertyId={propertyId} editing={editing} />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete "${toDelete?.title}"?`}
        description="This task will be removed permanently."
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

function SummaryCard({
  label, value, tone = "default",
}: { label: string; value: number; tone?: "default" | "success" | "info" | "warning" | "destructive" }) {
  const cls =
    tone === "success" ? "text-green-600" :
    tone === "info" ? "text-blue-600" :
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

function CategoryManager({
  open, onOpenChange, propertyId, categories,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  categories: { id: string; name: string }[];
}) {
  const create = useCreateTaskCategory(propertyId);
  const del = useDeleteTaskCategory(propertyId);
  const [name, setName] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Task Categories</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category" />
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
                <span className="text-sm">{c.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => del.mutate(c.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
