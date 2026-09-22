"use client";
import { useState } from "react";
import { Plus, DoorOpen, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useProperty } from "@/features/properties/hooks";
import { useRoomsWithOccupancy, useCreateRoom } from "@/features/rooms/hooks";
import { RoomForm } from "@/features/rooms/components/room-form";
import { RoomCard } from "@/features/rooms/components/room-card";
import type { RoomWithOccupancy } from "@/features/rooms/types";

export default function RoomsPage() {
  const { property, isLoading: loadingProperty } = useProperty();
  const propertyId = property?.id;
  const { data: rooms = [], isLoading } = useRoomsWithOccupancy(propertyId);
  const create = useCreateRoom(propertyId ?? "");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = rooms.filter(
    (r) =>
      r.room_number.toLowerCase().includes(search.toLowerCase()) ||
      (r.room_type ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<RoomWithOccupancy>[] = [
    { key: "room", header: "Room", cell: (r) => <span className="font-medium">{r.room_number}</span> },
    { key: "type", header: "Type", cell: (r) => r.room_type ?? "—" },
    { key: "floor", header: "Floor", cell: (r) => r.floor ?? "—" },
    { key: "capacity", header: "Capacity", cell: (r) => r.capacity },
    { key: "occupied", header: "Occupied", cell: (r) => `${r.occupied} / ${r.capacity}` },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
  ];

 if (loadingProperty) return <div className="text-muted-foreground">Loading…</div>;

if (!propertyId) {
  return (
    <div className="space-y-4">
      <EmptyState
        title="No property linked"
        description="Your user is not linked to a property. If you believe this is wrong, click Retry below."
      />
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Rooms</h1>
          <p className="text-sm text-muted-foreground">
            {rooms.length} rooms · {rooms.reduce((s, r) => s + r.capacity, 0)} total beds
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border">
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setView("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Room
          </Button>
        </div>
      </div>

      <Input
        placeholder="Search by room number or type…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={DoorOpen}
          title={search ? "No rooms match your search" : "No rooms yet"}
          description={search ? "Try a different keyword." : "Add your first room to get started."}
          action={
            !search && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Room
              </Button>
            )
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((r) => (
            <RoomCard key={r.id} room={r} />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          emptyState={<EmptyState title="No rooms" />}
          onRowClick={(r) => {
            window.location.href = `/rooms/${r.id}`;
          }}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
          </DialogHeader>
          <RoomForm
            loading={create.isPending}
            submitLabel="Create Room"
            onSubmit={async (v) => {
              await create.mutateAsync({
                property_id: propertyId,
                room_number: v.room_number,
                floor: v.floor ?? null,
                room_type: v.room_type ?? null,
                capacity: v.capacity,
                description: v.description ?? null,
                google_drive_url: v.google_drive_url || null,
                notes: v.notes ?? null,
              });
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
