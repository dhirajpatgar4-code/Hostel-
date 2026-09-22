import { Badge } from "./badge";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "muted";

const MAP: Record<string, { label: string; variant: Variant }> = {
  available: { label: "Available", variant: "success" },
  partially_occupied: { label: "Partially Occupied", variant: "warning" },
  fully_occupied: { label: "Fully Occupied", variant: "destructive" },
  maintenance: { label: "Maintenance", variant: "muted" },
  inactive: { label: "Inactive", variant: "muted" },
  Working: { label: "Working", variant: "success" },
  Broken: { label: "Broken", variant: "destructive" },
  Replaced: { label: "Replaced", variant: "muted" },
  Good: { label: "Good", variant: "success" },
  Fair: { label: "Fair", variant: "warning" },
  Poor: { label: "Poor", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  partial: { label: "Partial", variant: "info" },
  overdue: { label: "Overdue", variant: "destructive" },
  in_progress: { label: "In Progress", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "muted" },
  urgent: { label: "Urgent", variant: "destructive" },
  high: { label: "High", variant: "warning" },
  medium: { label: "Medium", variant: "info" },
  low: { label: "Low", variant: "muted" },
};

export function StatusBadge({ value, className }: { value?: string | null; className?: string }) {
  if (!value) return <Badge variant="muted" className={className}>—</Badge>;
  const cfg = MAP[value] ?? { label: value.replace(/_/g, " "), variant: "muted" as Variant };
  return <Badge variant={cfg.variant} className={cn("capitalize", className)}>{cfg.label}</Badge>;
}
