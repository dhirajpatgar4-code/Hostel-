import { z } from "zod";

export const contactSchema = z.object({
  property_id: z.string().uuid(),
  category_id: z.string().uuid().optional().nullable(),
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;