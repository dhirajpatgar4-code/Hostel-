import { z } from "zod";

export const taskSchema = z.object({
  property_id: z.string().uuid(),
  room_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  title: z.string().min(2).max(150),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().optional(),
  reminder_date: z.string().optional(),
  assigned_to: z.string().max(100).optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
  notes: z.string().max(1000).optional(),
});
export type TaskInput = z.infer<typeof taskSchema>;