import { createClient } from "@/lib/supabase/client";
import type { TeamMember, Invite, UserRole } from "./types";

const sb = () => createClient();

// ─── PROPERTY / HOSTEL SETTINGS ────────────────────────────

export async function updateProperty(propertyId: string, patch: {
  name?: string; address?: string | null; phone?: string | null;
  email?: string | null; maps_link?: string | null; logo_url?: string | null;
  tagline?: string | null; accent_color?: string | null;
}) {
  const { data, error } = await sb().from("properties").update(patch).eq("id", propertyId).select().single();
  if (error) throw error;
  return data;
}

export async function getHostelSettings(propertyId: string) {
  const { data, error } = await sb().from("hostel_settings").select("*").eq("property_id", propertyId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateHostelSettings(propertyId: string, patch: any) {
  const { data, error } = await sb()
    .from("hostel_settings")
    .upsert({ property_id: propertyId, ...patch }, { onConflict: "property_id" })
    .select().single();
  if (error) throw error;
  return data;
}

// ─── TEAM ──────────────────────────────────────────────────

export async function listTeamMembers(propertyId: string): Promise<TeamMember[]> {
  // Fetch property_users + join profiles for name/email
  const { data: members, error } = await sb()
    .from("property_users")
    .select("id, user_id, role, created_at")
    .eq("property_id", propertyId);
  if (error) throw error;
  if (!members?.length) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await sb()
    .from("profiles")
    .select("user_id, full_name, phone")
    .in("user_id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  // Also fetch auth emails via the invitations (Supabase doesn't expose auth.users from client)
  return members.map((m) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role as UserRole,
    full_name: profileMap.get(m.user_id)?.full_name ?? null,
    email: null, // populated by the admin via invitations
    created_at: m.created_at,
  }));
}

export async function updateMemberRole(propertyId: string, userId: string, role: UserRole) {
  const { error } = await sb()
    .from("property_users")
    .update({ role })
    .eq("property_id", propertyId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function removeMember(propertyId: string, userId: string) {
  const { error } = await sb()
    .from("property_users")
    .delete()
    .eq("property_id", propertyId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ─── INVITES ───────────────────────────────────────────────

export async function listInvites(propertyId: string): Promise<Invite[]> {
  const { data, error } = await sb()
    .from("property_invites")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createInvite(propertyId: string, email: string, role: UserRole) {
  const { data: { user } } = await sb().auth.getUser();
  const { data, error } = await sb()
    .from("property_invites")
    .upsert(
      { property_id: propertyId, email: email.toLowerCase().trim(), role, invited_by: user?.id ?? null, status: "pending" },
      { onConflict: "property_id,email" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function revokeInvite(id: string) {
  const { error } = await sb().from("property_invites").update({ status: "revoked" }).eq("id", id);
  if (error) throw error;
}

export async function deleteInvite(id: string) {
  const { error } = await sb().from("property_invites").delete().eq("id", id);
  if (error) throw error;
}

// Auto-accept function called on login: any pending invite for this email
// converts into a property_users row.
export async function acceptPendingInvites() {
  const { data: { user } } = await sb().auth.getUser();
  if (!user?.email) return;

  const { data: invites } = await sb()
    .from("property_invites")
    .select("*")
    .eq("email", user.email.toLowerCase())
    .eq("status", "pending");

  for (const inv of invites ?? []) {
    const { error: linkErr } = await sb()
      .from("property_users")
      .upsert({ property_id: inv.property_id, user_id: user.id, role: inv.role }, { onConflict: "property_id,user_id" });
    if (!linkErr) {
      await sb().from("property_invites")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", inv.id);
    }
  }
}

// ─── NOTIFICATIONS / PREFERENCES ───────────────────────────

export async function getNotificationPreferences(userId: string) {
  const { data, error } = await sb()
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function updateNotificationPreferences(userId: string, patch: any) {
  const { data, error } = await sb()
    .from("notification_preferences")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── LOGO UPLOAD ───────────────────────────────────────────

export async function uploadPropertyLogo(propertyId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${propertyId}/logo.${ext}`;
  const { error: upErr } = await sb()
    .storage.from("documents")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) throw upErr;
  const { data } = sb().storage.from("documents").getPublicUrl(path);
  return data.publicUrl;
}
