import { z } from "zod";

export const expenseSchema = z.object({
  property_id: z.string().uuid(),
  room_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional(),
  amount: z.coerce.number().nonnegative(),
  expense_date: z.string(),
  payment_method: z.enum(["cash", "upi", "bank_transfer", "card", "other"]),
  paid_to: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;