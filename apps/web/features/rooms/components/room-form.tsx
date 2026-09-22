"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roomSchema, type RoomInput } from "@hostelhub/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RoomForm({
  defaultValues, onSubmit, loading, submitLabel = "Save",
}: {
  defaultValues?: Partial<RoomInput>;
  onSubmit: (values: RoomInput) => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}) {
  const form = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues: { capacity: 1, ...defaultValues },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="room_number">Room Number *</Label>
          <Input id="room_number" {...form.register("room_number")} placeholder="R1" />
          {form.formState.errors.room_number && (
            <p className="text-xs text-destructive">{form.formState.errors.room_number.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="floor">Floor</Label>
          <Input id="floor" type="number" {...form.register("floor")} placeholder="1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="room_type">Room Type</Label>
          <Input id="room_type" {...form.register("room_type")} placeholder="Single / Double / Dorm" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="capacity">Capacity *</Label>
          <Input id="capacity" type="number" min={1} {...form.register("capacity")} />
          {form.formState.errors.capacity && (
            <p className="text-xs text-destructive">{form.formState.errors.capacity.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={2} {...form.register("description")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="google_drive_url">Google Drive Folder URL</Label>
        <Input id="google_drive_url" type="url" {...form.register("google_drive_url")} placeholder="https://drive.google.com/..." />
        {form.formState.errors.google_drive_url && (
          <p className="text-xs text-destructive">{form.formState.errors.google_drive_url.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} {...form.register("notes")} />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}