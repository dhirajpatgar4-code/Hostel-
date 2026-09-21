import { z } from "zod";

export const DOCUMENT_CATEGORIES = [
  "electricity_bills",
  "water_bills",
  "ads",
  "agreements",
  "property_documents",
  "maintenance_bills",
  "receipts",
  "important",
  "other",
] as const;

export const documentSchema = z.object({
  property_id: z.string().uuid(),
  room_id: z.string().uuid().optional().nullable(),
  category: z.enum(DOCUMENT_CATEGORIES),
  title: z.string().min(2).max(150),
  description: z.string().max(500).optional(),
});
export type DocumentInput = z.infer<typeof documentSchema>;