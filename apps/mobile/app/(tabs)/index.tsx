import { useQuery } from "@tanstack/react-query";
import { ScrollView, View, Text, RefreshControl } from "react-native";
import { Screen, Card, CardHeader, Title, Subtitle, Muted, Loading } from "@/components/ui";
import { getMyProperty, getOccupancy, getRevenueSummary } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { colors, spacing } from "@/lib/theme";

export default function Dashboard() {
  const prop = useQuery({ queryKey: ["property"], queryFn: getMyProperty });
  const propertyId = prop.data?.property.id;

  const occ = useQuery({
    queryKey: ["occupancy", propertyId],
    enabled: !!propertyId,
    queryFn: () => getOccupancy(propertyId!),
  });

  const rev = useQuery({
    queryKey: ["revenue", propertyId],
    enabled: !!propertyId,
    queryFn: () => getRevenueSummary(propertyId!),
  });

  if (prop.isLoading || !prop.data) return <Loading />;

  const o = occ.data;
  const r = rev.data;
  const pct = o && Number(o.total_capacity)
    ? Math.round((Number(o.occupied_beds) / Number(o.total_capacity)) * 100)
    : 0;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={
        <RefreshControl
          refreshing={occ.isFetching || rev.isFetching}
          onRefresh={() => { occ.refetch(); rev.refetch(); }}
        />
      }
    >
      <Title>{prop.data.property.name}</Title>
      <Subtitle>Overview</Subtitle>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        <Stat label="Total Rooms" value={o?.total_rooms ?? 0} />
        <Stat label="Occupied" value={o?.occupied_rooms ?? 0} />
        <Stat label="Vacant" value={o?.vacant_rooms ?? 0} />
        <Stat label="Occupancy" value={`${pct}%`} />
        <Stat label="Beds" value={o?.total_capacity ?? 0} />
        <Stat label="Available" value={o?.available_beds ?? 0} />
      </View>

      <Card style={{ marginTop: spacing.md }}>
        <CardHeader title="This Month" />
        <Row label="Rent Expected" value={formatCurrency(r?.rentExpected ?? 0)} />
        <Row label="Rent Collected" value={formatCurrency(r?.rentCollected ?? 0)} tone="success" />
        <Row label="Rent Pending" value={formatCurrency(r?.rentPending ?? 0)} tone="warning" />
      </Card>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <View style={{
      width: "48%", padding: spacing.md, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, backgroundColor: colors.card,
    }}>
      <Muted>{label}</Muted>
      <Text style={{ fontSize: 20, fontWeight: "700", marginTop: 4, color: colors.fg }}>{value}</Text>
    </View>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
      <Muted>{label}</Muted>
      <Text style={{
        fontWeight: "600",
        color: tone === "success" ? colors.success : tone === "warning" ? colors.warning : colors.fg,
      }}>{value}</Text>
    </View>
  );
}
