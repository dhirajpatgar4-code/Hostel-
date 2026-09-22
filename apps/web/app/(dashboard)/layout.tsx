"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DashboardTodoPanel } from "@/components/dashboard-todo-panel";
import { useProperty } from "@/features/properties/hooks";
import { acceptPendingInvites } from "@/features/settings/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { property } = useProperty();

  // Redirect to login if not authed + auto-accept any pending invites
  useEffect(() => {
    let mounted = true;
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      if (mounted) await acceptPendingInvites();
    })();
    return () => { mounted = false; };
  }, [router]);

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
      {property?.id && <DashboardTodoPanel propertyId={property.id} />}
    </div>
  );
}
