import { useQuery } from "@tanstack/react-query";
import { ScrollView, View, Text, RefreshControl, Linking, TouchableOpacity } from "react-native";
import { Phone, MessageCircle } from "lucide-react-native";
import { Card, Title, Subtitle, Muted, Loading, Empty } from "@/components/ui";
import { getMyProperty, listContacts } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";

export default function ContactsScreen() {
  const prop = useQuery({ queryKey: ["property"], queryFn: getMyProperty });
  const propertyId = prop.data?.property.id;

  const contacts = useQuery({
    queryKey: ["contacts", propertyId],
    enabled: !!propertyId,
    queryFn: () => listContacts(propertyId!),
  });

  if (contacts.isLoading) return <Loading />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={contacts.isFetching} onRefresh={() => contacts.refetch()} />}
    >
      <Title>Contacts</Title>
      <Subtitle>{(contacts.data ?? []).length} contacts</Subtitle>

      {!contacts.data?.length ? (
        <Empty title="No contacts" description="Add contacts from the web dashboard." />
      ) : (
        contacts.data.map((c) => (
          <Card key={c.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.fg }}>{c.name}</Text>
                <Muted>{c.category_name ?? "—"}</Muted>
                {c.phone && <Muted style={{ marginTop: 2 }}>{c.phone}</Muted>}
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {c.phone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${c.phone}`)}
                    style={{ padding: 8, borderRadius: 999, backgroundColor: colors.muted }}
                  >
                    <Phone color={colors.primary} size={16} />
                  </TouchableOpacity>
                )}
                {c.phone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://wa.me/${c.phone!.replace(/\D/g, "")}`)}
                    style={{ padding: 8, borderRadius: 999, backgroundColor: colors.muted }}
                  >
                    <MessageCircle color={colors.success} size={16} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
