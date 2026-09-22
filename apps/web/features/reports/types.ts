export type ReportKind =
  | "revenue"
  | "expenses"
  | "payments"
  | "rent"
  | "electricity"
  | "occupancy"
  | "tenants"
  | "rooms";

export type ReportPeriod = { month: number; year: number };

export type ReportFilters = {
  from?: string;   // ISO date
  to?: string;     // ISO date
  month?: number;
  year?: number;
  roomId?: string;
  status?: string;
  categoryId?: string;
};

export type ReportRow = Record<string, string | number | null>;

export type ReportPayload = {
  kind: ReportKind;
  title: string;
  subtitle: string;
  summary: { label: string; value: string | number }[];
  columns: { key: string; label: string; align?: "left" | "right" | "center" }[];
  rows: ReportRow[];
  hostel: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
  };
  generatedAt: string;
  period: ReportPeriod | null;
};
