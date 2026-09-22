import { useQuery } from "@tanstack/react-query";
import { ScrollView, View, Text, RefreshControl } from "react-native";
import { Card, Title, Subtitle, Muted, Loading, Empty } from "@/components/ui";
import { getMyProperty, listPayments } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { colors, spacing } from "@/lib/theme";

export default function PaymentsScreen() {
  const prop = useQuery({ queryKey: ["property"], queryFn: getMyProperty });
  const propertyId = prop.data?.property.id;

  const payments = useQuery({
    queryKey: ["payments", propertyId],
    enabled: !!propertyId,
    queryFn: () => listPayments(propertyId!),
  });

  if (payments.isLoading) return <Loading />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={payments.isFetching} onRefresh={() => payments.refetch()} />}
    >
      <Title>Payments</Title>
      <Subtitle>{(payments.data ?? []).length} recent payments</Subtitle>

      {!payments.data?.length ? (
        <Empty title="No payments" description="Record payments from the web dashboard." />
      ) : (
        payments.data.map((p) => (
          <Card key={p.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.fg }}>
                  {formatCurrency(p.amount)}
                </Text>
                <Muted>{p.tenant_name} · {p.room_number ?? "—"}</Muted>
                <Muted style={{ marginTop: 2 }}>
                  {formatDate(p.payment_date)} · {p.payment_method.replace("_", " ")}
                </Muted>
              </View>
              {p.transaction_ref && <Muted>{p.transaction_ref}</Muted>}
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
