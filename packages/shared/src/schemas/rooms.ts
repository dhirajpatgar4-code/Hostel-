import { z } from "zod";

export const roomSchema = z.object({
  room_number: z.string().min(1, "Room number required").max(20),
  floor: z.coerce.number().int().optional(),
  room_type: z.string().max(50).optional(),
  capacity: z.coerce.number().int().min(1).max(50),
  description: z.string().max(2000).optional(),
  google_drive_url: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});
export type RoomInput = z.infer<typeof roomSchema>;

export const roomAssetSchema = z.object({
  room_id: z.string().uuid(),
  asset_name: z.string().min(1).max(100),
  quantity: z.coerce.number().int().min(0).max(1000),
  condition: z.enum(["Good", "Fair", "Poor", "Broken"]),
  status: z.enum(["Working", "Broken", "Replaced"]),
  purchase_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});
export type RoomAssetInput = z.infer<typeof roomAssetSchema>;