"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, DoorOpen, Users, CreditCard, Zap, Receipt,
  ListChecks, Package, Phone, FileText, BarChart3, Settings, QrCode,
  CalendarCheck, Moon, Sun, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rooms", label: "Rooms", icon: DoorOpen },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard, exact: true },
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

function isActive(pathname: string, href: string, exact?: boolean) {
  if (pathname === href) return true;
  if (exact) return false;
  return pathname.startsWith(href + "/");
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div className="md:hidden sticky top-0 z-30 h-14 bg-background/95 backdrop-blur border-b flex items-center px-3 gap-3">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <Logo size={24} />
          <span className="font-semibold text-sm truncate">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "HostelHub PMS"}
          </span>
        </Link>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-background border-r shadow-xl h-full flex flex-col animate-in slide-in-from-left duration-200">
            <div className="h-14 flex items-center justify-between px-4 border-b">
              <div className="flex items-center gap-2">
                <Logo size={24} />
                <span className="font-semibold text-sm">
                  {process.env.NEXT_PUBLIC_APP_NAME ?? "HostelHub PMS"}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {NAV.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(pathname, href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-medium"
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
              <ThemeToggleRow />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ThemeToggleRow() {
  const { resolved, toggle } = useTheme();
  return (
    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={toggle}>
      {resolved === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
      {resolved === "dark" ? "Light mode" : "Dark mode"}
    </Button>
  );
}

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
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-medium"
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
