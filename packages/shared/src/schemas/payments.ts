import { z } from "zod";

export const paymentSchema = z.object({
  tenant_id: z.string().uuid(),
  rent_record_id: z.string().uuid().optional(),
  room_id: z.string().uuid().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  payment_date: z.string(),
  payment_method: z.enum(["cash", "upi", "bank_transfer", "card", "other"]),
  transaction_ref: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const rentRecordSchema = z.object({
  tenant_id: z.string().uuid(),
  allocation_id: z.string().uuid().optional(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  rent_amount: z.coerce.number().nonnegative(),
  due_date: z.string(),
});
export type RentRecordInput = z.infer<typeof rentRecordSchema>;