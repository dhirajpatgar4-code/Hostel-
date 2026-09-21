import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  maps_link: z.string().url().optional().or(z.literal("")),
});
export type PropertyInput = z.infer<typeof propertySchema>;

export const hostelSettingsSchema = z.object({
  rent_due_day: z.coerce.number().int().min(1).max(28),
  rent_reminder_days: z.coerce.number().int().min(0).max(30),
  grace_period_days: z.coerce.number().int().min(0).max(30),
  electricity_reminder_day: z.coerce.number().int().min(1).max(28),
  currency: z.string().min(1).max(5),
  date_format: z.string().min(1).max(20),
  timezone: z.string().min(1).max(50),
});
export type HostelSettingsInput = z.infer<typeof hostelSettingsSchema>;