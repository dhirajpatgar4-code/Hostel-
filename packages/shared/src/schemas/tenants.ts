import { z } from "zod";

export const phoneRegex = /^[+]?[0-9 \-()]{7,20}$/;
export const aadhaarRegex = /^\d{12}$/;
export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const tenantSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone: z.string().regex(phoneRegex, "Invalid phone").optional().or(z.literal("")),
  aadhaar: z.string().regex(aadhaarRegex, "Aadhaar must be 12 digits").optional().or(z.literal("")),
  pan: z.string().regex(panRegex, "Invalid PAN").optional().or(z.literal("")),
  permanent_address: z.string().max(500).optional(),
  monthly_rent: z.coerce.number().nonnegative(),
  security_deposit: z.coerce.number().nonnegative(),
});
export type TenantInput = z.infer<typeof tenantSchema>;

export const allocationSchema = z.object({
  tenant_id: z.string().uuid(),
  room_id: z.string().uuid(),
  allocation_date: z.string(),
  deallocation_date: z.string().optional(),
  rent_amount: z.coerce.number().nonnegative(),
  deposit_amount: z.coerce.number().nonnegative(),
  notes: z.string().max(500).optional(),
}).refine(
  (d) => !d.deallocation_date || new Date(d.deallocation_date) >= new Date(d.allocation_date),
  { message: "Deallocation cannot be before allocation", path: ["deallocation_date"] }
);
export type AllocationInput = z.infer<typeof allocationSchema>;