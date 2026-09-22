import { useQuery } from "@tanstack/react-query";
import { ScrollView, View, Text, RefreshControl } from "react-native";
import { Card, Title, Subtitle, Muted, Badge, Loading, Empty } from "@/components/ui";
import { getMyProperty, listElectricity } from "@/lib/api";
import { formatCurrency, monthName, formatDate } from "@/lib/format";
import { colors, spacing } from "@/lib/theme";

export default function ElectricityScreen() {
  const prop = useQuery({ queryKey: ["property"], queryFn: getMyProperty });
  const propertyId = prop.data?.property.id;

  const bills = useQuery({
    queryKey: ["electricity", propertyId],
    enabled: !!propertyId,
    queryFn: () => listElectricity(propertyId!),
  });

  if (bills.isLoading) return <Loading />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={bills.isFetching} onRefresh={() => bills.refetch()} />}
    >
      <Title>Electricity</Title>
      <Subtitle>{(bills.data ?? []).length} bill records</Subtitle>

      {!bills.data?.length ? (
        <Empty title="No bills" description="Generate monthly bills from the web dashboard." />
      ) : (
        bills.data.map((b) => (
          <Card key={b.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.fg }}>
                  Room {b.room_number}
                </Text>
                <Muted>{monthName(b.billing_month)} {b.billing_year}</Muted>
                <Muted style={{ marginTop: 2 }}>
                  {formatCurrency(b.bill_amount)} · {b.bill_date ? formatDate(b.bill_date) : "No bill date"}
                </Muted>
              </View>
              <Badge
                label={b.status.replace("_", " ")}
                tone={
                  b.status === "paid" ? "success"
                  : b.status === "overdue" ? "destructive"
                  : b.status === "photo_pending" ? "muted"
                  : "warning"
                }
              />
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
