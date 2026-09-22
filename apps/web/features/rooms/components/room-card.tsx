"use client";
import Link from "next/link";
import { DoorOpen, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RoomWithOccupancy } from "../types";

export function RoomCard({ room }: { room: RoomWithOccupancy }) {
  return (
    <Link href={`/rooms/${room.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
        <div className="aspect-video w-full bg-muted relative">
          {room.primary_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={room.primary_image_url} alt={room.room_number} className="object-cover w-full h-full" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <DoorOpen className="h-8 w-8" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <StatusBadge value={room.status} />
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg">{room.room_number}</div>
              {room.room_type && <div className="text-xs text-muted-foreground">{room.room_type}</div>}
            </div>
            {room.floor != null && (
              <div className="text-xs text-muted-foreground">Floor {room.floor}</div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{room.occupied} / {room.capacity} occupied</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}