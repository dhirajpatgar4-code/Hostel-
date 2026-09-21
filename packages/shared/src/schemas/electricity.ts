import { z } from "zod";

export const electricityBillSchema = z.object({
  room_id: z.string().uuid(),
  meter_id: z.string().uuid().optional(),
  billing_month: z.coerce.number().int().min(1).max(12),
  billing_year: z.coerce.number().int().min(2000).max(2100),
  bill_amount: z.coerce.number().nonnegative(),
  bill_date: z.string().optional(),
  due_date: z.string().optional(),
  meter_reading: z.coerce.number().nonnegative().optional(),
  status: z.enum(["pending", "paid", "overdue", "photo_pending"]).default("pending"),
  notes: z.string().max(500).optional(),
});
export type ElectricityBillInput = z.infer<typeof electricityBillSchema>;

export const electricityMeterSchema = z.object({
  room_id: z.string().uuid(),
  consumer_number: z.string().max(50).optional(),
  meter_number: z.string().max(50).optional(),
  current_reading: z.coerce.number().nonnegative().optional(),
  previous_reading: z.coerce.number().nonnegative().optional(),
});
export type ElectricityMeterInput = z.infer<typeof electricityMeterSchema>;