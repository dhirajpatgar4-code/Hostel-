import { Tabs } from "expo-router";
import { Home, DoorOpen, Users, CreditCard, Zap, ListChecks, Settings } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#2563eb", headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <Home color={color} /> }} />
      <Tabs.Screen name="rooms" options={{ title: "Rooms", tabBarIcon: ({ color }) => <DoorOpen color={color} /> }} />
      <Tabs.Screen name="tenants" options={{ title: "Tenants", tabBarIcon: ({ color }) => <Users color={color} /> }} />
      <Tabs.Screen name="payments" options={{ title: "Payments", tabBarIcon: ({ color }) => <CreditCard color={color} /> }} />
      <Tabs.Screen name="electricity" options={{ title: "Electricity", tabBarIcon: ({ color }) => <Zap color={color} /> }} />
      <Tabs.Screen name="tasks" options={{ title: "Tasks", tabBarIcon: ({ color }) => <ListChecks color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <Settings color={color} /> }} />
    </Tabs>
  );
}