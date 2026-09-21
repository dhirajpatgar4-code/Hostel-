import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardHome() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's first property
  const { data: membership } = await supabase
    .from("property_users")
    .select("property_id, role, properties(name)")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  const propertyId = membership?.property_id as string | undefined;
  const propertyName = (membership as any)?.properties?.name ?? "Your Hostel";

  let occupancy = { total_rooms: 0, occupied_rooms: 0, vacant_rooms: 0, total_capacity: 0, occupied_beds: 0, available_beds: 0 };
  if (propertyId) {
    const { data } = await supabase.rpc("get_occupancy", { p_property: propertyId });
    if (data && data[0]) occupancy = data[0];
  }

  const occupancyPct = occupancy.total_capacity
    ? Math.round((Number(occupancy.occupied_beds) / Number(occupancy.total_capacity)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{propertyName}</h1>
        <p className="text-sm text-muted-foreground">Overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Rooms" value={occupancy.total_rooms} />
        <StatCard label="Occupied Rooms" value={occupancy.occupied_rooms} />
        <StatCard label="Vacant Rooms" value={occupancy.vacant_rooms} />
        <StatCard label="Occupancy" value={`${occupancyPct}%`} />
        <StatCard label="Total Beds" value={occupancy.total_capacity} />
        <StatCard label="Occupied Beds" value={occupancy.occupied_beds} />
        <StatCard label="Available Beds" value={occupancy.available_beds} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}