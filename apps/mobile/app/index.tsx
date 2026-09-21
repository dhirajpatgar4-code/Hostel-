import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setReady(true);
    });
  }, []);

  if (!ready) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator /></View>;
  return <Redirect href={authed ? "/(tabs)" : "/(auth)/login"} />;
}