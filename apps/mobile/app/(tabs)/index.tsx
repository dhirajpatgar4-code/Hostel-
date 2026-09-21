import { View, Text, StyleSheet } from "react-native";

export default function Dashboard() {
  return (
    <View style={s.container}>
      <Text style={s.title}>Dashboard</Text>
      <Text style={s.sub}>Overview metrics will be wired in Phase 2.</Text>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: "600" },
  sub: { color: "#666" },
});