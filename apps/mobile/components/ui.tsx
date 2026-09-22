import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, ScrollView,
} from "react-native";
import { colors, radius, spacing } from "../lib/theme";

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={s.screen}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={s.cardHeader}>
      <Text style={s.cardTitle}>{title}</Text>
      {right}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={s.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.subtitle}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={s.muted}>{children}</Text>;
}

export function Button({
  title, onPress, variant = "default", disabled, loading,
}: {
  title: string;
  onPress?: () => void;
  variant?: "default" | "outline" | "destructive" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        s.btn,
        variant === "outline" && s.btnOutline,
        variant === "destructive" && s.btnDestructive,
        variant === "ghost" && s.btnGhost,
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? colors.primary : colors.primaryFg} />
      ) : (
        <Text style={[
          s.btnText,
          variant === "outline" && { color: colors.primary },
          variant === "ghost" && { color: colors.fg },
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function Input({
  value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, multiline, numberOfLines,
}: any) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedFg}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      multiline={multiline}
      numberOfLines={numberOfLines}
      style={[s.input, multiline && { minHeight: 80, textAlignVertical: "top" }]}
    />
  );
}

export function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "warning" | "destructive" | "muted" }) {
  return (
    <View style={[
      s.badge,
      tone === "success" && { backgroundColor: "#dcfce7" },
      tone === "warning" && { backgroundColor: "#fef3c7" },
      tone === "destructive" && { backgroundColor: "#fee2e2" },
      tone === "muted" && { backgroundColor: colors.muted },
    ]}>
      <Text style={[
        s.badgeText,
        tone === "success" && { color: "#166534" },
        tone === "warning" && { color: "#92400e" },
        tone === "destructive" && { color: "#991b1b" },
      ]}>{label}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.row, style]}>{children}</View>;
}

export function Empty({ title, description }: { title: string; description?: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{title}</Text>
      {description && <Text style={s.emptyDesc}>{description}</Text>}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ padding: spacing.xl, alignItems: "center" }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function ListItem({
  title, subtitle, right, onPress,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const Container: any = onPress ? TouchableOpacity : View;
  return (
    <Container style={s.listItem} onPress={onPress}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.listTitle} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={s.listSub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right}
    </Container>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.fg },
  title: { fontSize: 22, fontWeight: "700", color: colors.fg, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.mutedFg, marginBottom: spacing.md },
  muted: { fontSize: 12, color: colors.mutedFg },
  btn: {
    backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: radius.md, alignItems: "center", justifyContent: "center",
  },
  btnOutline: {
    backgroundColor: "transparent", borderWidth: 1, borderColor: colors.primary,
  },
  btnDestructive: { backgroundColor: colors.destructive },
  btnGhost: { backgroundColor: "transparent" },
  btnText: { color: colors.primaryFg, fontWeight: "600", fontSize: 14 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.fg,
    backgroundColor: colors.bg, marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
    backgroundColor: colors.muted, alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "600", color: colors.fg },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  empty: { padding: spacing.xl, alignItems: "center" },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: colors.fg },
  emptyDesc: { fontSize: 13, color: colors.mutedFg, marginTop: 4, textAlign: "center" },
  listItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  listTitle: { fontSize: 15, fontWeight: "500", color: colors.fg },
  listSub: { fontSize: 12, color: colors.mutedFg, marginTop: 2 },
});
