import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { Card, Title, Subtitle, Muted, Badge, Loading, Empty } from "@/components/ui";
import { getMyProperty, listTasks } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/format";
import { colors, spacing } from "@/lib/theme";

export default function TasksScreen() {
  const qc = useQueryClient();
  const prop = useQuery({ queryKey: ["property"], queryFn: getMyProperty });
  const propertyId = prop.data?.property.id;

  const tasks = useQuery({
    queryKey: ["tasks", propertyId],
    enabled: !!propertyId,
    queryFn: () => listTasks(propertyId!),
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("maintenance_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  if (tasks.isLoading) return <Loading />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={tasks.isFetching} onRefresh={() => tasks.refetch()} />}
    >
      <Title>Tasks</Title>
      <Subtitle>{(tasks.data ?? []).filter((t) => t.status !== "completed").length} open tasks</Subtitle>

      {!tasks.data?.length ? (
        <Empty title="No tasks" description="Add tasks from the web dashboard." />
      ) : (
        tasks.data.map((t) => (
          <Card key={t.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.fg }}>{t.title}</Text>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                  <Badge
                    label={t.priority}
                    tone={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "warning" : "muted"}
                  />
                  <Badge
                    label={t.status.replace("_", " ")}
                    tone={t.status === "completed" ? "success" : t.status === "in_progress" ? "warning" : "muted"}
                  />
                </View>
                <Muted style={{ marginTop: 6 }}>
                  {t.room_number ? `Room ${t.room_number}` : "Hostel-wide"}
                  {t.due_date ? ` · Due ${formatDate(t.due_date)}` : ""}
                  {t.assigned_to ? ` · ${t.assigned_to}` : ""}
                </Muted>
              </View>
              {t.status !== "completed" && (
                <TouchableOpacity
                  onPress={() => complete.mutate(t.id)}
                  style={{ padding: 8, marginLeft: 8 }}
                >
                  <CheckCircle2 color={colors.success} size={22} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
