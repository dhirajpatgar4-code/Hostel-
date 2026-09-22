"use client";
import { Bell, LogOut, User, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { useState, useEffect } from "react";

export function Topbar() {
  const supabase = createClient();
  const router = useRouter();
  const { resolved, toggle } = useTheme();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 border-b bg-background flex items-center justify-end gap-2 px-4">
      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
        {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline text-muted-foreground">{email}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}
