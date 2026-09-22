import { useQuery } from "@tanstack/react-query";
import { ScrollView, View, Text, RefreshControl } from "react-native";
import { Screen, Card, Title, Subtitle, Muted, Badge, Loading, Empty } from "@/components/ui";
import { getMyProperty, listRoomsWithOccupancy } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";

export default function RoomsScreen() {
  const prop = useQuery({ queryKey: ["property"], queryFn: getMyProperty });
  const propertyId = prop.data?.property.id;

  const rooms = useQuery({
    queryKey: ["rooms", propertyId],
    enabled: !!propertyId,
    queryFn: () => listRoomsWithOccupancy(propertyId!),
  });

  if (rooms.isLoading) return <Loading />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={rooms.isFetching} onRefresh={() => rooms.refetch()} />}
    >
      <Title>Rooms</Title>
      <Subtitle>{(rooms.data ?? []).length} rooms · {(rooms.data ?? []).reduce((s, r) => s + r.capacity, 0)} total beds</Subtitle>

      {!rooms.data?.length ? (
        <Empty title="No rooms" description="Add rooms from the web dashboard." />
      ) : (
        rooms.data.map((r) => (
          <Card key={r.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.fg }}>{r.room_number}</Text>
                <Muted>{r.room_type ?? "—"} · Floor {r.floor ?? "—"}</Muted>
                <Muted style={{ marginTop: 4 }}>{r.occupied} / {r.capacity} occupied</Muted>
              </View>
              <Badge
                label={
                  r.status === "available" ? "Available"
                  : r.status === "fully_occupied" ? "Full"
                  : "Partial"
                }
                tone={r.status === "available" ? "success" : r.status === "fully_occupied" ? "destructive" : "warning"}
              />
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
