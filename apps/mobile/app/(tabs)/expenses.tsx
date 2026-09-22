import { useQuery } from "@tanstack/react-query";
import { ScrollView, View, Text, RefreshControl } from "react-native";
import { Card, Title, Subtitle, Muted, Loading, Empty } from "@/components/ui";
import { getMyProperty, listExpenses } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { colors, spacing } from "@/lib/theme";

export default function ExpensesScreen() {
  const prop = useQuery({ queryKey: ["property"], queryFn: getMyProperty });
  const propertyId = prop.data?.property.id;

  const expenses = useQuery({
    queryKey: ["expenses", propertyId],
    enabled: !!propertyId,
    queryFn: () => listExpenses(propertyId!),
  });

  if (expenses.isLoading) return <Loading />;
  const total = (expenses.data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={expenses.isFetching} onRefresh={() => expenses.refetch()} />}
    >
      <Title>Expenses</Title>
      <Subtitle>{(expenses.data ?? []).length} entries · {formatCurrency(total)} total</Subtitle>

      {!expenses.data?.length ? (
        <Empty title="No expenses" description="Add expenses from the web dashboard." />
      ) : (
        expenses.data.map((e) => (
          <Card key={e.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.fg }}>
                  {formatCurrency(e.amount)}
                </Text>
                <Muted>{e.category_name ?? "Uncategorized"} · {e.room_number ?? "Hostel-wide"}</Muted>
                <Muted style={{ marginTop: 2 }}>{formatDate(e.expense_date)} {e.paid_to ? `· ${e.paid_to}` : ""}</Muted>
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
