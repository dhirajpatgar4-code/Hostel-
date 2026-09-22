"use client";
import { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTasks, useCompleteTask, useDeleteTask } from "@/features/tasks/hooks";
import { TaskFormDialog } from "@/features/tasks/components/task-form";
import { formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/features/tasks/types";

export function RoomTasks({ roomId, propertyId }: { roomId: string; propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);
  const { data: tasks = [], isLoading } = useTasks(propertyId, { roomId });
  const complete = useCompleteTask(propertyId);
  const del = useDeleteTask(propertyId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Room Tasks</CardTitle>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : !tasks.length ? (
          <EmptyState
            title="No tasks for this room"
            description="Maintenance and reminders for this room will appear here."
            action={
              <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Task
              </Button>
            }
          />
        ) : (
          <div className="divide-y">
            {tasks.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{t.title}</span>
                    <StatusBadge value={t.priority} />
                    <StatusBadge value={t.status} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t.due_date ? `Due ${formatDate(t.due_date)}` : ""}
                    {t.assigned_to ? ` · ${t.assigned_to}` : ""}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {t.status !== "completed" && (
                    <Button size="sm" variant="ghost" onClick={() => complete.mutate(t.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(t.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <TaskFormDialog open={open} onOpenChange={setOpen} propertyId={propertyId} editing={editing} presetRoomId={roomId} />
    </Card>
  );
}
