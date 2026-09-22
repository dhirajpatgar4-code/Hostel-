"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, DoorOpen, Users, CreditCard, Zap, Receipt,
  ListChecks, Package, Phone, FileText, BarChart3, Settings, QrCode,
  CalendarCheck, Moon, Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rooms", label: "Rooms", icon: DoorOpen },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/payments/qr", label: "Payment QRs", icon: QrCode },
  { href: "/electricity", label: "Electricity", icon: Zap },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/staff", label: "Staff", icon: CalendarCheck },
  { href: "/contacts", label: "Contacts", icon: Phone },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { resolved, toggle } = useTheme();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "HostelHub PMS";

  return (
    <aside className="hidden md:flex md:flex-col w-60 border-r bg-background">
      <div className="h-14 flex items-center px-4 border-b gap-2">
        <Logo size={26} />
        <span className="font-semibold tracking-tight text-sm">{appName}</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={toggle}>
          {resolved === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
          {resolved === "dark" ? "Light mode" : "Dark mode"}
        </Button>
      </div>
    </aside>
  );
}
