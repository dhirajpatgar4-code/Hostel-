"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tenantSchema, type TenantInput } from "@hostelhub/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TenantForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel = "Save",
}: {
  defaultValues?: Partial<TenantInput>;
  onSubmit: (values: TenantInput) => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}) {
  const form = useForm<TenantInput>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      monthly_rent: 0,
      security_deposit: 0,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input id="full_name" {...form.register("full_name")} placeholder="Rahul Sharma" />
        {form.formState.errors.full_name && (
          <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...form.register("phone")} placeholder="+91 9876543210" />
          {form.formState.errors.phone && (
            <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="aadhaar">Aadhaar Number</Label>
          <Input id="aadhaar" {...form.register("aadhaar")} placeholder="123456789012" maxLength={12} />
          {form.formState.errors.aadhaar && (
            <p className="text-xs text-destructive">{form.formState.errors.aadhaar.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="pan">PAN</Label>
          <Input id="pan" {...form.register("pan")} placeholder="ABCDE1234F" maxLength={10} />
          {form.formState.errors.pan && (
            <p className="text-xs text-destructive">{form.formState.errors.pan.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="monthly_rent">Monthly Rent (₹) *</Label>
          <Input id="monthly_rent" type="number" min={0} step="0.01" {...form.register("monthly_rent")} />
          {form.formState.errors.monthly_rent && (
            <p className="text-xs text-destructive">{form.formState.errors.monthly_rent.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="security_deposit">Security Deposit (₹) *</Label>
        <Input id="security_deposit" type="number" min={0} step="0.01" {...form.register("security_deposit")} />
        {form.formState.errors.security_deposit && (
          <p className="text-xs text-destructive">{form.formState.errors.security_deposit.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="permanent_address">Permanent Address</Label>
        <Textarea id="permanent_address" rows={2} {...form.register("permanent_address")} />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}