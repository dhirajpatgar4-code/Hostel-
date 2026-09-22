import { ScrollView, View, Text, Alert } from "react-native";
import { router } from "expo-router";
import { Card, Title, Subtitle, Muted, Button, ListItem } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { getMyProperty } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";

export default function SettingsScreen() {
  const prop = useQuery({ queryKey: ["property"], queryFn: getMyProperty });

  async function signOut() {
    Alert.alert("Sign out?", "You will need to log in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <Title>Settings</Title>
      <Subtitle>App and hostel information</Subtitle>

      <Card>
        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.fg, marginBottom: 8 }}>
          {prop.data?.property.name ?? "Loading…"}
        </Text>
        {prop.data?.property.address && <Muted>{prop.data.property.address}</Muted>}
        {prop.data?.property.phone && <Muted>{prop.data.property.phone}</Muted>}
        {prop.data?.property.email && <Muted>{prop.data.property.email}</Muted>}
      </Card>

      <View style={{ height: spacing.md }} />
      <Button title="Sign out" variant="destructive" onPress={signOut} />
    </ScrollView>
  );
}
