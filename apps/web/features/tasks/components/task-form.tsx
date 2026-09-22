"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRoomsWithOccupancy } from "@/features/rooms/hooks";
import {
  useTaskCategories, useCreateTask, useUpdateTask,
} from "../hooks";
import type { TaskWithRelations } from "../types";

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;

export function TaskFormDialog({
  open, onOpenChange, propertyId, editing, presetRoomId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  editing: TaskWithRelations | null;
  presetRoomId?: string;
}) {
  const { data: rooms = [] } = useRoomsWithOccupancy(propertyId);
  const { data: categories = [] } = useTaskCategories(propertyId);
  const create = useCreateTask(propertyId);
  const update = useUpdateTask(propertyId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roomId, setRoomId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>("medium");
  const [status, setStatus] = useState<typeof STATUSES[number]>("pending");
  const [dueDate, setDueDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setDescription(editing?.description ?? "");
    setRoomId(editing?.room_id ?? presetRoomId ?? "");
    setCategoryId(editing?.category_id ?? "");
    setPriority((editing?.priority as any) ?? "medium");
    setStatus((editing?.status as any) ?? "pending");
    setDueDate(editing?.due_date ?? "");
    setReminderDate(editing?.reminder_date ?? "");
    setAssignedTo(editing?.assigned_to ?? "");
    setNotes(editing?.notes ?? "");
  }, [open, editing?.id, presetRoomId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    const payload = {
      property_id: propertyId,
      room_id: roomId || null,
      category_id: categoryId || null,
      title,
      description: description || null,
      priority,
      due_date: dueDate || null,
      reminder_date: reminderDate || null,
      assigned_to: assignedTo || null,
      status,
      notes: notes || null,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Task" : "Add Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fix fan in R1"
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Room</Label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Hostel-wide</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.room_number}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Reminder Date</Label>
              <Input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Assigned To</Label>
            <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Person name" />
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!title || create.isPending || update.isPending}>
              {create.isPending || update.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
