import { useQuery } from "@tanstack/react-query";
import { ScrollView, View, Text, RefreshControl, Linking, TouchableOpacity } from "react-native";
import { Phone } from "lucide-react-native";
import { Card, Title, Subtitle, Muted, Loading, Empty, ListItem } from "@/components/ui";
import { getMyProperty, listTenants } from "@/lib/api";
import { formatCurrency, maskPhone } from "@/lib/format";
import { colors, spacing } from "@/lib/theme";

export default function TenantsScreen() {
  const prop = useQuery({ queryKey: ["property"], queryFn: getMyProperty });
  const propertyId = prop.data?.property.id;

  const tenants = useQuery({
    queryKey: ["tenants", propertyId],
    enabled: !!propertyId,
    queryFn: () => listTenants(propertyId!),
  });

  if (tenants.isLoading) return <Loading />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={tenants.isFetching} onRefresh={() => tenants.refetch()} />}
    >
      <Title>Tenants</Title>
      <Subtitle>{(tenants.data ?? []).length} active tenants</Subtitle>

      {!tenants.data?.length ? (
        <Empty title="No tenants" description="Add tenants from the web dashboard." />
      ) : (
        tenants.data.map((t) => (
          <Card key={t.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.fg }}>{t.full_name}</Text>
                <Muted>{t.current_room_number ? `Room ${t.current_room_number}` : "Not allocated"}</Muted>
                <Muted style={{ marginTop: 2 }}>{maskPhone(t.phone)} · Rent {formatCurrency(t.monthly_rent)}</Muted>
              </View>
              {t.phone && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${t.phone}`)}
                  style={{
                    padding: 10, borderRadius: 999, backgroundColor: colors.muted,
                    marginLeft: spacing.sm,
                  }}
                >
                  <Phone color={colors.primary} size={18} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
