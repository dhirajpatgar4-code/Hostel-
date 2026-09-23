"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Archive, ExternalLink, DoorOpen, Plus, Bed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useProperty } from "@/features/properties/hooks";
import { useRoom, useUpdateRoom, useArchiveRoom } from "@/features/rooms/hooks";
import { useRoomAllocations } from "@/features/tenants/hooks";
import { RoomForm } from "@/features/rooms/components/room-form";
import { RoomAssets } from "@/features/rooms/components/room-assets";
import { RoomImages } from "@/features/rooms/components/room-images";
import { RoomDocuments } from "@/features/rooms/components/room-documents";
import { RoomElectricity } from "@/features/electricity/components/room-electricity";
import { RoomExpenses } from "@/features/rooms/components/room-expenses";
import { RoomTasks } from "@/features/rooms/components/room-tasks";
import { AllocateTenantDialog } from "@/features/tenants/components/allocate-tenant-dialog";
import { TenantAvatar } from "@/features/tenants/components/tenant-avatar";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const { data: room, isLoading } = useRoom(id);
  const update = useUpdateRoom(propertyId);
  const archive = useArchiveRoom(propertyId);
  const { data: allocs = [] } = useRoomAllocations(id);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);

  const tenantIds = Array.from(new Set(allocs.map((a) => a.tenant_id)));
  const { data: tenantsMap = {} } = useQuery({
    queryKey: ["tenants-by-ids", tenantIds.join(",")],
    enabled: tenantIds.length > 0,
    queryFn: async () => {
      const sb = createClient();
      const { data } = await sb
        .from("tenants")
        .select("id, full_name, phone, profile_photo_url")
        .in("id", tenantIds);
      const m: Record<string, any> = {};
      (data ?? []).forEach((t) => { m[t.id] = t; });
      return m;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded animate-pulse" />)}
      </div>
    );
  }
  if (!room) {
    return (
      <EmptyState
        icon={DoorOpen}
        title="Room not found"
        action={<Button asChild><Link href="/rooms">Back to Rooms</Link></Button>}
      />
    );
  }

  const activeAlloc = allocs.find((a) => a.status === "active");
  const pastAllocs = allocs.filter((a) => a.status !== "active");
  const activeTenant = activeAlloc ? tenantsMap[activeAlloc.tenant_id] : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header — mobile friendly */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 -ml-1" onClick={() => router.push("/rooms")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-xl sm:text-2xl font-semibold">Room {room.room_number}</h1>
              <StatusBadge value={room.archived ? "inactive" : activeAlloc ? "fully_occupied" : "available"} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {room.room_type ?? "—"} · Floor {room.floor ?? "—"} · Capacity {room.capacity}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setConfirmArchive(true)}>
            <Archive className="h-4 w-4 mr-1" /> Archive
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Info label="Capacity" value={room.capacity} />
          <Info label="Floor" value={room.floor ?? "—"} />
          <Info label="Type" value={room.room_type ?? "—"} />
          <Info
            label="Drive"
            value={
              room.google_drive_url ? (
                <a href={room.google_drive_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 text-xs sm:text-sm">
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              ) : "—"
            }
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="tenants">
        <TabsList>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="electricity">Electricity</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle>Current Tenant</CardTitle>
              {!activeAlloc && (
                <Button size="sm" onClick={() => setAllocOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Tenant
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {activeAlloc && activeTenant ? (
                <Link href={`/tenants/${activeTenant.id}`} className="flex items-center gap-3 group">
                  <TenantAvatar path={activeTenant.profile_photo_url} name={activeTenant.full_name} className="h-12 w-12" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium group-hover:text-primary truncate">{activeTenant.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Since {formatDate(activeAlloc.allocation_date)} · Rent ₹{activeAlloc.rent_amount.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <Bed className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ) : (
                <EmptyState
                  title="No tenant currently allocated"
                  description="Allocate a tenant to this room."
                  action={<Button size="sm" onClick={() => setAllocOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Tenant</Button>}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Previous Tenants</CardTitle></CardHeader>
            <CardContent>
              {!pastAllocs.length ? (
                <p className="text-sm text-muted-foreground">No previous tenants.</p>
              ) : (
                <div className="divide-y">
                  {pastAllocs.map((a) => {
                    const t = tenantsMap[a.tenant_id];
                    return (
                      <Link
                        key={a.id}
                        href={`/tenants/${a.tenant_id}`}
                        className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded"
                      >
                        {t ? (
                          <TenantAvatar path={t.profile_photo_url} name={t.full_name} className="h-9 w-9" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-muted" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{t?.full_name ?? "Unknown"}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {formatDate(a.allocation_date)} → {formatDate(a.deallocation_date)}
                          </div>
                        </div>
                        <StatusBadge value={a.status} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {room.description || "No description provided."}
              </p>
              {room.notes && (
                <>
                  <div className="mt-4 text-xs uppercase text-muted-foreground">Notes</div>
                  <p className="text-sm whitespace-pre-line">{room.notes}</p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets"><RoomAssets roomId={room.id} /></TabsContent>
        <TabsContent value="photos"><RoomImages roomId={room.id} propertyId={propertyId} /></TabsContent>
        <TabsContent value="documents"><RoomDocuments roomId={room.id} propertyId={propertyId} /></TabsContent>
        <TabsContent value="electricity"><RoomElectricity roomId={room.id} propertyId={propertyId} /></TabsContent>
        <TabsContent value="expenses"><RoomExpenses roomId={room.id} propertyId={propertyId} /></TabsContent>
        <TabsContent value="tasks"><RoomTasks roomId={room.id} propertyId={propertyId} /></TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Room {room.room_number}</DialogTitle></DialogHeader>
          <RoomForm
            defaultValues={{
              room_number: room.room_number,
              floor: room.floor ?? undefined,
              room_type: room.room_type ?? undefined,
              capacity: room.capacity,
              description: room.description ?? undefined,
              google_drive_url: room.google_drive_url ?? undefined,
              notes: room.notes ?? undefined,
            }}
            submitLabel="Save Changes"
            loading={update.isPending}
            onSubmit={async (v) => {
              await update.mutateAsync({
                id: room.id,
                patch: {
                  room_number: v.room_number,
                  floor: v.floor ?? null,
                  room_type: v.room_type ?? null,
                  capacity: v.capacity,
                  description: v.description ?? null,
                  google_drive_url: v.google_drive_url || null,
                  notes: v.notes ?? null,
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
        title={`Archive Room ${room.room_number}?`}
        description="Archived rooms are hidden from the list. Historical data is preserved."
        confirmLabel="Archive"
        onConfirm={async () => {
          await archive.mutateAsync(room.id);
          router.push("/rooms");
        }}
      />

      <AllocateTenantDialog
        open={allocOpen}
        onOpenChange={setAllocOpen}
        propertyId={propertyId}
        presetRoomId={room.id}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5 truncate">{value}</div>
    </div>
  );
}
