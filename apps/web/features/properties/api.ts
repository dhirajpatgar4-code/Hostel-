import { createClient } from "@/lib/supabase/client";

export type Property = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  maps_link: string | null;
  logo_url: string | null;
};

export async function getMyProperty(): Promise<{ property: Property; role: string } | null> {
  const supabase = createClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) {
    console.error("[getMyProperty] auth error:", authErr);
    return null;
  }
  if (!user) {
    console.warn("[getMyProperty] no logged-in user");
    return null;
  }
  console.log("[getMyProperty] user:", user.id, user.email);

  const { data: memberships, error: memErr } = await supabase
    .from("property_users")
    .select("property_id, role")
    .eq("user_id", user.id)
    .limit(1);

  console.log("[getMyProperty] memberships:", memberships, "err:", memErr);

  if (memErr) {
    console.error("[getMyProperty] membership error:", memErr);
    return null;
  }

  const membership = memberships?.[0];
  if (!membership) {
    console.warn("[getMyProperty] no membership row for this user");
    return null;
  }

  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("id, name, address, phone, email, maps_link, logo_url")
    .eq("id", membership.property_id)
    .maybeSingle();

  console.log("[getMyProperty] property:", property, "err:", propErr);

  if (propErr) {
    console.error("[getMyProperty] property error:", propErr);
    return null;
  }
  if (!property) {
    console.warn("[getMyProperty] property row not found");
    return null;
  }

  return { property: property as Property, role: membership.role as string };
}
