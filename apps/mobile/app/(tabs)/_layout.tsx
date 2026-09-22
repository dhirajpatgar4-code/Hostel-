import { Tabs } from "expo-router";
import {
  Home, DoorOpen, Users, CreditCard, Zap, Receipt, ListChecks, Phone, Settings,
} from "lucide-react-native";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedFg,
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: "Dashboard",
        tabBarIcon: ({ color }) => <Home color={color} size={22} />,
      }} />
      <Tabs.Screen name="rooms" options={{
        title: "Rooms",
        tabBarIcon: ({ color }) => <DoorOpen color={color} size={22} />,
      }} />
      <Tabs.Screen name="tenants" options={{
        title: "Tenants",
        tabBarIcon: ({ color }) => <Users color={color} size={22} />,
      }} />
      <Tabs.Screen name="payments" options={{
        title: "Payments",
        tabBarIcon: ({ color }) => <CreditCard color={color} size={22} />,
      }} />
      <Tabs.Screen name="electricity" options={{
        title: "Electricity",
        tabBarIcon: ({ color }) => <Zap color={color} size={22} />,
      }} />
      <Tabs.Screen name="expenses" options={{
        title: "Expenses",
        tabBarIcon: ({ color }) => <Receipt color={color} size={22} />,
      }} />
      <Tabs.Screen name="tasks" options={{
        title: "Tasks",
        tabBarIcon: ({ color }) => <ListChecks color={color} size={22} />,
      }} />
      <Tabs.Screen name="contacts" options={{
        title: "Contacts",
        tabBarIcon: ({ color }) => <Phone color={color} size={22} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: "Settings",
        tabBarIcon: ({ color }) => <Settings color={color} size={22} />,
      }} />
    </Tabs>
  );
}
