import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DoorOpen, Users, CreditCard, Zap, Receipt, ListChecks, Phone, Package,
  FileText, BarChart3, TrendingUp, Calendar, QrCode,
} from "lucide-react";

export default async function DashboardHome() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("property_users")
    .select("property_id, role, properties(name, logo_url)")
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

  const quickLinks = [
    { href: "/rooms",            label: "Rooms",        icon: DoorOpen,    color: "text-blue-600" },
    { href: "/tenants",          label: "Tenants",      icon: Users,       color: "text-purple-600" },
    { href: "/payments",         label: "Payments",     icon: CreditCard,  color: "text-green-600" },
    { href: "/payments/qr",      label: "Payment QRs",  icon: QrCode,      color: "text-emerald-600" },
    { href: "/electricity",      label: "Electricity",  icon: Zap,         color: "text-amber-600" },
    { href: "/expenses",         label: "Expenses",     icon: Receipt,     color: "text-red-600" },
    { href: "/tasks",            label: "Tasks",        icon: ListChecks,  color: "text-indigo-600" },
    { href: "/inventory",        label: "Inventory",    icon: Package,     color: "text-pink-600" },
    { href: "/contacts",         label: "Contacts",     icon: Phone,       color: "text-cyan-600" },
    { href: "/documents",        label: "Documents",    icon: FileText,    color: "text-orange-600" },
    { href: "/reports",          label: "Reports",      icon: BarChart3,   color: "text-teal-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold truncate">{propertyName}</h1>
        <p className="text-sm text-muted-foreground">Overview of your hostel</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Rooms"   value={occupancy.total_rooms}    icon={DoorOpen} />
        <StatCard label="Occupied"      value={occupancy.occupied_rooms} icon={Users}   tone="success" />
        <StatCard label="Vacant"        value={occupancy.vacant_rooms}   icon={DoorOpen} tone="muted" />
        <StatCard label="Occupancy"     value={`${occupancyPct}%`}       icon={TrendingUp} tone="info" />
        <StatCard label="Total Beds"    value={occupancy.total_capacity} icon={Calendar} />
        <StatCard label="Occupied Beds" value={occupancy.occupied_beds}  tone="success" />
        <StatCard label="Available Beds" value={occupancy.available_beds} tone="warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all duration-150 active:scale-[0.98]"
              >
                <Icon className={`h-6 w-6 ${color} transition-transform group-hover:scale-110`} />
                <span className="text-xs sm:text-sm font-medium text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, tone = "default",
}: {
  label: string;
  value: string | number;
  icon?: any;
  tone?: "default" | "success" | "warning" | "info" | "muted";
}) {
  const toneCls =
    tone === "success" ? "text-green-600 dark:text-green-500" :
    tone === "warning" ? "text-amber-600 dark:text-amber-500" :
    tone === "info" ? "text-blue-600 dark:text-blue-500" :
    tone === "muted" ? "text-muted-foreground" : "";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground/60 shrink-0" />}
        </div>
        <div className={`text-2xl font-semibold mt-2 ${toneCls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
