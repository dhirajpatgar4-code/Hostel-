import { useState } from "react";
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Title, Subtitle, Button, Input } from "@/components/ui";
import { colors, spacing } from "@/lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return Alert.alert("Login failed", error.message);
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: spacing.xl }}>
        <Title>HostelHub PMS</Title>
        <Subtitle>Sign in to manage your hostel</Subtitle>

        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />

        <View style={{ height: spacing.md }} />
        <Button title={loading ? "Signing in…" : "Sign in"} onPress={onLogin} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
