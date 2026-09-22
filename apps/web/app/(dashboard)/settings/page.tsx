"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, Bell, Users, Moon, Sun, Save, Upload, Palette, UserPlus, Trash2, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { useProperty } from "@/features/properties/hooks";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/components/ui/toaster";
import {
  useUpdateProperty,
  useTeam, useInvites, useCreateInvite, useRevokeInvite, useDeleteInvite,
  useUpdateMemberRole, useRemoveMember,
  useNotificationPrefs, useUpdateNotificationPrefs,
} from "@/features/settings/hooks";
import { uploadPropertyLogo } from "@/features/settings/api";
import { USER_ROLES, type UserRole } from "@/features/settings/types";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  if (!propertyId) return <div className="text-muted-foreground">Loading property…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage hostel, team, notifications and appearance</p>
      </div>

      <Tabs defaultValue="hostel">
        <TabsList>
          <TabsTrigger value="hostel"><Building2 className="h-4 w-4 mr-1" /> Hostel</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-4 w-4 mr-1" /> Team</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" /> Notifications</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="h-4 w-4 mr-1" /> Appearance</TabsTrigger>
          <TabsTrigger value="links"><Shield className="h-4 w-4 mr-1" /> Other</TabsTrigger>
        </TabsList>

        <TabsContent value="hostel"><HostelTab propertyId={propertyId} property={property} /></TabsContent>
        <TabsContent value="team"><TeamTab propertyId={propertyId} /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab userId={userId} /></TabsContent>
        <TabsContent value="appearance"><AppearanceTab /></TabsContent>
        <TabsContent value="links">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Link href="/staff" className="rounded-lg border p-4 hover:bg-muted/40 transition">
              <div className="font-medium">Staff Attendance</div>
              <p className="text-xs text-muted-foreground mt-1">Track kamwali / cleaner attendance & salary</p>
            </Link>
            <Link href="/contacts" className="rounded-lg border p-4 hover:bg-muted/40 transition">
              <div className="font-medium">Contacts</div>
              <p className="text-xs text-muted-foreground mt-1">Electricians, plumbers, etc.</p>
            </Link>
            <Link href="/payments/qr" className="rounded-lg border p-4 hover:bg-muted/40 transition">
              <div className="font-medium">Payment QR Codes</div>
              <p className="text-xs text-muted-foreground mt-1">UPI QRs for rent collection</p>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HOSTEL TAB
// ═══════════════════════════════════════════════════════════

function HostelTab({ propertyId, property }: { propertyId: string; property: any }) {
  const update = useUpdateProperty(propertyId);
  const { success, error: toastErr } = useToast();
  const [name, setName] = useState(property.name ?? "");
  const [address, setAddress] = useState(property.address ?? "");
  const [phone, setPhone] = useState(property.phone ?? "");
  const [email, setEmail] = useState(property.email ?? "");
  const [mapsLink, setMapsLink] = useState(property.maps_link ?? "");
  const [tagline, setTagline] = useState(property.tagline ?? "");
  const [logoUrl, setLogoUrl] = useState(property.logo_url ?? "");
  const [uploading, setUploading] = useState(false);

  async function handleLogo(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return toastErr("Invalid file", "Only images allowed");
    if (file.size > 2 * 1024 * 1024) return toastErr("Too large", "Max 2 MB");
    setUploading(true);
    try {
      const url = await uploadPropertyLogo(propertyId, file);
      setLogoUrl(url);
      await update.mutateAsync({ logo_url: url });
    } catch (e: any) {
      toastErr("Upload failed", e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Hostel Information</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-lg border flex items-center justify-center bg-muted overflow-hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleLogo(e.target.files)}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("logo-upload")?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-1" /> {uploading ? "Uploading…" : "Upload Logo"}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">PNG or JPG, max 2 MB</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Hostel Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Tagline</Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Safe & comfortable stay" />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Address</Label>
          <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Google Maps Link</Label>
          <Input value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="https://maps.google.com/..." />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={async () => {
              await update.mutateAsync({
                name, address: address || null, phone: phone || null,
                email: email || null, maps_link: mapsLink || null,
                tagline: tagline || null,
              });
            }}
            disabled={update.isPending}
          >
            <Save className="h-4 w-4 mr-1" /> {update.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// TEAM TAB
// ═══════════════════════════════════════════════════════════

function TeamTab({ propertyId }: { propertyId: string }) {
  const { data: team = [], isLoading: loadingTeam } = useTeam(propertyId);
  const { data: invites = [], isLoading: loadingInvites } = useInvites(propertyId);
  const createInvite = useCreateInvite(propertyId);
  const revokeInvite = useRevokeInvite(propertyId);
  const deleteInvite = useDeleteInvite(propertyId);
  const updateRole = useUpdateMemberRole(propertyId);
  const removeMember = useRemoveMember(propertyId);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("manager");
  const [toRemove, setToRemove] = useState<{ userId: string; name: string } | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Invite someone to share access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Enter the email address the person will use to sign in. Once they sign up or log in with that email,
            they'll automatically get access to this hostel with the role you select.
          </p>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1 flex-1 min-w-[220px]">
              <Label>Email</Label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="example1@gmail.com"
                type="email"
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={async () => {
                if (!inviteEmail.includes("@")) return;
                await createInvite.mutateAsync({ email: inviteEmail, role: inviteRole });
                setInviteEmail("");
              }}
              disabled={createInvite.isPending || !inviteEmail.includes("@")}
            >
              <UserPlus className="h-4 w-4 mr-1" /> Send Invite
            </Button>
          </div>

          {invites.length > 0 && (
            <div className="divide-y border rounded-lg">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium text-sm">{inv.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Role: {inv.role} · Status:{" "}
                      <span className={
                        inv.status === "accepted" ? "text-green-600" :
                        inv.status === "pending" ? "text-amber-600" : "text-muted-foreground"
                      }>{inv.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {inv.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => revokeInvite.mutate(inv.id)}>
                        Revoke
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteInvite.mutate(inv.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Current members</CardTitle></CardHeader>
        <CardContent>
          {loadingTeam ? (
            <div className="h-20 bg-muted rounded animate-pulse" />
          ) : !team.length ? (
            <EmptyState title="No members yet" />
          ) : (
            <div className="divide-y">
              {team.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-sm">{m.full_name || m.user_id.slice(0, 8) + "…"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{m.user_id.slice(0, 8)}…</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => updateRole.mutate({ userId: m.user_id, role: e.target.value as UserRole })}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setToRemove({ userId: m.user_id, name: m.full_name || "this user" })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        title={`Remove ${toRemove?.name}?`}
        description="They will lose access to this hostel. Historical data is preserved."
        confirmLabel="Remove"
        onConfirm={async () => {
          if (toRemove) await removeMember.mutateAsync(toRemove.userId);
          setToRemove(null);
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS TAB
// ═══════════════════════════════════════════════════════════

function NotificationsTab({ userId }: { userId: string | null }) {
  const { data: prefs } = useNotificationPrefs(userId ?? undefined);
  const update = useUpdateNotificationPrefs(userId ?? "");

  if (!userId) return <div className="text-muted-foreground">Loading…</div>;

  const items = [
    { key: "push_enabled", label: "Push notifications", desc: "Allow browser & app notifications" },
    { key: "rent_reminders", label: "Rent reminders", desc: "Get notified before rent is due" },
    { key: "electricity_reminders", label: "Electricity bill reminders", desc: "Reminders for bill uploads" },
    { key: "task_reminders", label: "Task reminders", desc: "Get notified when tasks are due" },
    { key: "login_summary", label: "Summary on login", desc: "See pending dues & tasks when you log in" },
    { key: "dashboard_todo", label: "Dashboard todo panel", desc: "Floating list in top-right with actions" },
  ];

  return (
    <Card>
      <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((it) => (
          <label
            key={it.key}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 cursor-pointer"
          >
            <div>
              <div className="font-medium text-sm">{it.label}</div>
              <div className="text-xs text-muted-foreground">{it.desc}</div>
            </div>
            <input
              type="checkbox"
              checked={prefs?.[it.key] ?? true}
              onChange={(e) => update.mutate({ [it.key]: e.target.checked })}
              className="h-5 w-5 accent-primary"
            />
          </label>
        ))}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// APPEARANCE TAB
// ═══════════════════════════════════════════════════════════

function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Choose how the app looks</p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`p-4 rounded-lg border text-center transition ${
              theme === "light" ? "border-primary bg-primary/5" : "hover:bg-muted/40"
            }`}
          >
            <Sun className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <div className="text-sm font-medium">Light</div>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-lg border text-center transition ${
              theme === "dark" ? "border-primary bg-primary/5" : "hover:bg-muted/40"
            }`}
          >
            <Moon className="h-6 w-6 mx-auto mb-2 text-indigo-500" />
            <div className="text-sm font-medium">Dark</div>
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`p-4 rounded-lg border text-center transition ${
              theme === "system" ? "border-primary bg-primary/5" : "hover:bg-muted/40"
            }`}
          >
            <Palette className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm font-medium">System</div>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Current theme: <span className="font-medium">{theme}</span>. Your choice is saved for this browser.
        </p>
      </CardContent>
    </Card>
  );
}
