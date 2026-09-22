"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useProperty } from "@/features/properties/hooks";
import { useTenants, useCreateTenant } from "@/features/tenants/hooks";
import { TenantForm } from "@/features/tenants/components/tenant-form";
import { TenantAvatar } from "@/features/tenants/components/tenant-avatar";
import { maskAadhaar, maskPhone } from "@/features/tenants/api";
import type { TenantWithRoom } from "@/features/tenants/types";

export default function TenantsPage() {
  const { property } = useProperty();
  const propertyId = property?.id;
  const { data: tenants = [], isLoading } = useTenants(propertyId);
  const create = useCreateTenant(propertyId ?? "");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = tenants.filter(
    (t) =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.phone ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.current_room_number ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<TenantWithRoom>[] = [
    {
      key: "name",
      header: "Tenant",
      cell: (t) => (
        <div className="flex items-center gap-2">
          <TenantAvatar path={t.profile_photo_url} name={t.full_name} className="h-8 w-8" />
          <div>
            <div className="font-medium">{t.full_name}</div>
            <div className="text-xs text-muted-foreground">{maskPhone(t.phone)}</div>
          </div>
        </div>
      ),
    },
    { key: "room", header: "Room", cell: (t) => t.current_room_number ?? "—" },
    { key: "aadhaar", header: "Aadhaar", cell: (t) => <span className="font-mono text-xs">{maskAadhaar(t.aadhaar)}</span> },
    { key: "rent", header: "Rent", cell: (t) => `₹${t.monthly_rent.toLocaleString("en-IN")}` },
    {
      key: "status",
      header: "Status",
      cell: (t) =>
        t.status === "active" ? (
          <span className="text-green-600 text-xs font-medium">Active</span>
        ) : (
          <span className="text-muted-foreground text-xs">Inactive</span>
        ),
    },
  ];

  if (!propertyId) return <div className="text-muted-foreground">Loading property…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tenants</h1>
          <p className="text-sm text-muted-foreground">{tenants.length} tenants</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Tenant
        </Button>
      </div>

      <Input
        placeholder="Search by name, phone, or room…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}</div>
      ) : !filtered.length ? (
        <EmptyState
          icon={Users}
          title={search ? "No tenants match your search" : "No tenants yet"}
          description={search ? "Try a different keyword." : "Add your first tenant to get started."}
          action={!search && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Tenant</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          onRowClick={(t) => { window.location.href = `/tenants/${t.id}`; }}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Tenant</DialogTitle></DialogHeader>
          <TenantForm
            loading={create.isPending}
            submitLabel="Create Tenant"
            onSubmit={async (v) => {
              await create.mutateAsync({
                property_id: propertyId,
                full_name: v.full_name,
                phone: v.phone || null,
                aadhaar: v.aadhaar || null,
                pan: v.pan || null,
                permanent_address: v.permanent_address || null,
                profile_photo_url: null,
                monthly_rent: v.monthly_rent,
                security_deposit: v.security_deposit,
                status: "active",
              });
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}