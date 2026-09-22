"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Archive, Upload, UserX, Bed, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useProperty } from "@/features/properties/hooks";
import { usePaymentsForTenant, useRentForTenant, useDepositsForTenant, useCreateDeposit, useRefundDeposit } from "@/features/payments/hooks";
import { formatCurrency, monthName } from "@/lib/utils";
import {
  useTenant, useUpdateTenant, useArchiveTenant,
  useTenantAllocations, useTenantDocuments,
  useUploadTenantPhoto,
} from "@/features/tenants/hooks";
import { maskAadhaar, maskPan, maskPhone } from "@/features/tenants/api";
import { TenantForm } from "@/features/tenants/components/tenant-form";
import { TenantDocuments } from "@/features/tenants/components/tenant-documents";
import { TenantAvatar } from "@/features/tenants/components/tenant-avatar";
import { DeallocateDialog } from "@/features/tenants/components/deallocate-dialog";
import { AllocateTenantDialog } from "@/features/tenants/components/allocate-tenant-dialog";
import { formatDate } from "@/lib/utils";

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const { data: tenant, isLoading } = useTenant(id);
  const update = useUpdateTenant(propertyId);
  const archive = useArchiveTenant(propertyId);
  const { data: allocs = [] } = useTenantAllocations(id);
  const uploadPhoto = useUploadTenantPhoto(propertyId, id);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [deallocOpen, setDeallocOpen] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const activeAlloc = allocs.find((a) => a.status === "active");
  const pastAllocs = allocs.filter((a) => a.status !== "active");

  if (isLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded animate-pulse" />)}</div>;
  }
  if (!tenant) {
    return (
      <EmptyState
        title="Tenant not found"
        action={<Button asChild><Link href="/tenants">Back to Tenants</Link></Button>}
      />
    );
  }

  async function handlePhoto(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) { alert("Only images allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Max 5 MB"); return; }
    await uploadPhoto.mutateAsync(file);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/tenants")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="relative group">
          <TenantAvatar path={tenant.profile_photo_url} name={tenant.full_name} className="h-16 w-16" />
          <button
            onClick={() => photoRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
            title="Change photo"
          >
            <Camera className="h-5 w-5" />
          </button>
          <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => handlePhoto(e.target.files)} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{tenant.full_name}</h1>
            <StatusBadge value={tenant.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {maskPhone(tenant.phone)} · Rent ₹{tenant.monthly_rent.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" onClick={() => setConfirmArchive(true)}>
            <Archive className="h-4 w-4 mr-1" /> Archive
          </Button>
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Info label="Phone" value={tenant.phone ?? "—"} mono />
          <Info label="Aadhaar" value={maskAadhaar(tenant.aadhaar)} mono />
          <Info label="PAN" value={maskPan(tenant.pan)} mono />
          <Info label="Security Deposit" value={`₹${tenant.security_deposit.toLocaleString("en-IN")}`} />
          <Info label="Monthly Rent" value={`₹${tenant.monthly_rent.toLocaleString("en-IN")}`} />
          <Info label="Permanent Address" value={tenant.permanent_address ?? "—"} />
        </CardContent>
      </Card>

      {/* Current allocation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current Room</CardTitle>
          {activeAlloc ? (
            <Button variant="outline" size="sm" onClick={() => setDeallocOpen(true)}>
              <UserX className="h-4 w-4 mr-1" /> Deallocate
            </Button>
          ) : (
            <Button size="sm" onClick={() => setAllocOpen(true)}>
              <Bed className="h-4 w-4 mr-1" /> Allocate to Room
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {activeAlloc ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Info label="Room ID" value={activeAlloc.room_id.slice(0, 8) + "…"} mono />
              <Info label="Allocated On" value={formatDate(activeAlloc.allocation_date)} />
              <Info label="Rent at Allocation" value={`₹${activeAlloc.rent_amount.toLocaleString("en-IN")}`} />
              <Info label="Deposit" value={`₹${activeAlloc.deposit_amount.toLocaleString("en-IN")}`} />
            </div>
          ) : (
            <EmptyState title="Not currently allocated to a room" />
          )}
        </CardContent>
      </Card>

     <Tabs defaultValue="documents">
  <TabsList>
    <TabsTrigger value="documents">Documents</TabsTrigger>
    <TabsTrigger value="payments">Payments</TabsTrigger>
    <TabsTrigger value="rent">Rent Records</TabsTrigger>
    <TabsTrigger value="deposits">Deposits</TabsTrigger>
    <TabsTrigger value="history">Allocation History</TabsTrigger>
  </TabsList>

  <TabsContent value="payments">
  <TenantPaymentsTab tenantId={tenant.id} />
</TabsContent>

<TabsContent value="rent">
  <TenantRentTab tenantId={tenant.id} />
</TabsContent>

<TabsContent value="deposits">
  <TenantDepositsTab tenantId={tenant.id} />
</TabsContent>
        <TabsContent value="documents">
          <TenantDocuments tenantId={tenant.id} propertyId={propertyId} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Allocation History</CardTitle></CardHeader>
            <CardContent>
              {!pastAllocs.length ? (
                <EmptyState title="No past allocations" />
              ) : (
                <div className="divide-y">
                  {pastAllocs.map((a) => (
                    <div key={a.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">Room {a.room_id.slice(0, 8)}…</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(a.allocation_date)} → {formatDate(a.deallocation_date)}
                        </div>
                      </div>
                      <StatusBadge value={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit {tenant.full_name}</DialogTitle></DialogHeader>
          <TenantForm
            defaultValues={{
              full_name: tenant.full_name,
              phone: tenant.phone ?? undefined,
              aadhaar: tenant.aadhaar ?? undefined,
              pan: tenant.pan ?? undefined,
              permanent_address: tenant.permanent_address ?? undefined,
              monthly_rent: tenant.monthly_rent,
              security_deposit: tenant.security_deposit,
            }}
            submitLabel="Save Changes"
            loading={update.isPending}
            onSubmit={async (v) => {
              await update.mutateAsync({
                id: tenant.id,
                patch: {
                  full_name: v.full_name,
                  phone: v.phone || null,
                  aadhaar: v.aadhaar || null,
                  pan: v.pan || null,
                  permanent_address: v.permanent_address || null,
                  monthly_rent: v.monthly_rent,
                  security_deposit: v.security_deposit,
                },
              });
              setEditOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={`Archive ${tenant.full_name}?`}
        description="Historical data is preserved. The tenant will be hidden from lists."
        confirmLabel="Archive"
        onConfirm={async () => {
          await archive.mutateAsync(tenant.id);
          router.push("/tenants");
        }}
      />

      <DeallocateDialog
        open={deallocOpen}
        onOpenChange={setDeallocOpen}
        propertyId={propertyId}
        allocationId={activeAlloc?.id ?? null}
      />

      <AllocateTenantDialog
        open={allocOpen}
        onOpenChange={setAllocOpen}
        propertyId={propertyId}
        presetTenantId={tenant.id}
      />
    </div>
  );
}


function Info({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
function TenantPaymentsTab({ tenantId }: { tenantId: string }) {
  const { data: payments = [], isLoading } = usePaymentsForTenant(tenantId);

  if (isLoading) return <Card><CardContent className="p-6"><div className="h-20 bg-muted rounded animate-pulse" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
      <CardContent>
        {!payments.length ? (
          <EmptyState title="No payments recorded" description="Record a payment from the Payments page." />
        ) : (
          <div className="divide-y">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{formatCurrency(p.amount)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(p.payment_date)} · {p.payment_method.replace("_", " ")}
                    {p.month && p.year ? ` · ${monthName(p.month)} ${p.year}` : ""}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.transaction_ref ?? ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TenantRentTab({ tenantId }: { tenantId: string }) {
  const { data: rents = [], isLoading } = useRentForTenant(tenantId);

  if (isLoading) return <Card><CardContent className="p-6"><div className="h-20 bg-muted rounded animate-pulse" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader><CardTitle>Rent Records</CardTitle></CardHeader>
      <CardContent>
        {!rents.length ? (
          <EmptyState title="No rent records" description="Generate rent from the Payments page." />
        ) : (
          <div className="divide-y">
            {rents.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{monthName(r.month)} {r.year}</div>
                  <div className="text-xs text-muted-foreground">Due {formatDate(r.due_date)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="text-green-600">{formatCurrency(r.paid_amount)}</span>
                    <span className="text-muted-foreground"> / {formatCurrency(r.rent_amount)}</span>
                  </div>
                  <StatusBadge value={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TenantDepositsTab({ tenantId }: { tenantId: string }) {
  const { data: deposits = [], isLoading } = useDepositsForTenant(tenantId);
  const create = useCreateDeposit(tenantId);
  const refund = useRefundDeposit(tenantId);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [refundOpenFor, setRefundOpenFor] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundDate, setRefundDate] = useState(new Date().toISOString().slice(0, 10));

  if (isLoading) return <Card><CardContent className="p-6"><div className="h-20 bg-muted rounded animate-pulse" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader><CardTitle>Security Deposits</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1">
            <label className="text-xs uppercase text-muted-foreground">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm w-32"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase text-muted-foreground">Received</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <Button
            size="sm"
            onClick={async () => {
              if (!amount) return;
              await create.mutateAsync({ tenant_id: tenantId, amount: Number(amount), received_date: date });
              setAmount("");
            }}
            disabled={!amount || create.isPending}
          >
            {create.isPending ? "Adding…" : "Add Deposit"}
          </Button>
        </div>

        {!deposits.length ? (
          <EmptyState title="No deposits recorded" />
        ) : (
          <div className="divide-y">
            {deposits.map((d) => (
              <div key={d.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{formatCurrency(d.amount)}</div>
                  <div className="text-xs text-muted-foreground">
                    Received {formatDate(d.received_date)}
                    {d.refunded_amount > 0 && ` · Refunded ${formatCurrency(d.refunded_amount)} on ${formatDate(d.refunded_date)}`}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setRefundOpenFor(d.id); setRefundAmount(String(d.amount)); setRefundDate(new Date().toISOString().slice(0, 10)); }}
                  disabled={d.refunded_amount >= d.amount}
                >
                  {d.refunded_amount >= d.amount ? "Fully Refunded" : "Refund"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {refundOpenFor && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60" onClick={() => setRefundOpenFor(null)}>
            <div className="bg-background rounded-lg p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold">Refund Deposit</h3>
              <div className="space-y-2">
                <label className="text-xs uppercase text-muted-foreground">Refund Amount</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
                <label className="text-xs uppercase text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRefundOpenFor(null)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    await refund.mutateAsync({ id: refundOpenFor, refunded_amount: Number(refundAmount), refunded_date: refundDate });
                    setRefundOpenFor(null);
                  }}
                  disabled={refund.isPending}
                >
                  {refund.isPending ? "Processing…" : "Refund"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}