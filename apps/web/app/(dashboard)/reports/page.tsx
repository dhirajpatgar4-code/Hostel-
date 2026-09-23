"use client";
import { useMemo, useState } from "react";
import {
  BarChart3, FileSpreadsheet, FileText, Download, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { useProperty } from "@/features/properties/hooks";
import { useRoomsWithOccupancy } from "@/features/rooms/hooks";
import { buildReport } from "@/features/reports/api";
import { exportReportToExcel } from "@/features/reports/export-excel";
import { exportReportToPdf } from "@/features/reports/export-pdf";
import { monthName, formatCurrency } from "@/lib/utils";
import type { ReportKind, ReportPayload } from "@/features/reports/types";

const KINDS: { key: ReportKind; label: string; desc: string }[] = [
  { key: "revenue", label: "Revenue", desc: "Monthly revenue summary" },
  { key: "expenses", label: "Expenses", desc: "Monthly expense log" },
  { key: "payments", label: "Payments", desc: "Payment collection log" },
  { key: "rent", label: "Rent", desc: "Rent status per tenant" },
  { key: "electricity", label: "Electricity", desc: "Monthly electricity bills" },
  { key: "occupancy", label: "Occupancy", desc: "Current occupancy snapshot" },
  { key: "tenants", label: "Tenants", desc: "All active tenants" },
  { key: "rooms", label: "Rooms", desc: "All rooms with status" },
];

export default function ReportsPage() {
  const { property } = useProperty();
  const propertyId = property?.id ?? "";
  const { success, error: toastErr } = useToast();
  const { data: rooms = [] } = useRoomsWithOccupancy(propertyId);

  const now = new Date();
  const [kind, setKind] = useState<ReportKind>("revenue");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [roomId, setRoomId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const filteredKinds = useMemo(() => KINDS, []);

  async function generate() {
    if (!propertyId) return;
    setLoading(true);
    try {
      const p = await buildReport(kind, propertyId, {
        month, year, roomId: roomId || undefined, status: statusFilter || undefined,
      });
      setPayload(p);
    } catch (e: any) {
      toastErr("Failed to build report", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toExcel() {
    if (!payload) return;
    try {
      setBusy(true);
      exportReportToExcel(payload);
      success("Excel downloaded");
    } catch (e: any) {
      toastErr("Export failed", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toPdf() {
    if (!payload) return;
    try {
      setBusy(true);
      await exportReportToPdf(payload);
      success("PDF downloaded");
    } catch (e: any) {
      toastErr("Export failed", e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!propertyId) return <div className="text-muted-foreground">Loading property…</div>;

  const showPeriod =
    kind === "revenue" || kind === "expenses" || kind === "payments" ||
    kind === "rent" || kind === "electricity";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate, preview and export professional reports
        </p>
      </div>

      {/* Report kind picker */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredKinds.map((k) => (
          <button
            key={k.key}
            onClick={() => setKind(k.key)}
            className={`text-left p-3 rounded-lg border transition-colors ${
              kind === k.key ? "border-primary bg-primary/5" : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{k.label}</span>
            </div>
            <div className="text-xs text-muted-foreground">{k.desc}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          {showPeriod && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Month</Label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{monthName(m)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(kind === "expenses") && (
            <div className="space-y-1">
              <Label className="text-xs">Room</Label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Rooms</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.room_number}</option>
                ))}
              </select>
            </div>
          )}

          {(kind === "rent" || kind === "electricity") && (
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                {kind === "rent" && <option value="partial">Partial</option>}
                {kind === "electricity" && <option value="photo_pending">Photo Pending</option>}
              </select>
            </div>
          )}

          <Button onClick={generate} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Building…" : "Generate"}
          </Button>

          {payload && (
            <>
              <Button variant="outline" onClick={toExcel} disabled={busy}>
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button variant="outline" onClick={toPdf} disabled={busy}>
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {!payload ? (
        <EmptyState
          icon={BarChart3}
          title="Select a report and click Generate"
          description="Pick any report above, set filters, and preview will appear here with export buttons."
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>{payload.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {payload.subtitle} · Generated {new Date(payload.generatedAt).toLocaleString("en-IN")}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {payload.summary.map((s, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-lg font-semibold mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Data table */}
            {!payload.rows.length ? (
              <EmptyState title="No data for this period" />
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      {payload.columns.map((c) => (
                        <th
                          key={c.key}
                          className={`px-4 py-3 font-medium text-muted-foreground ${
                            c.align === "right" ? "text-right" : ""
                          }`}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payload.rows.map((r, i) => (
                      <tr key={i} className="border-t hover:bg-muted/30">
                        {payload.columns.map((c) => (
                          <td
                            key={c.key}
                            className={`px-4 py-2 ${
                              c.align === "right" ? "text-right" : ""
                            }`}
                          >
                            {typeof r[c.key] === "number" &&
                            (c.key === "amount" || c.key === "rent" || c.key === "paid" ||
                             c.key === "pending" || c.key === "deposit")
                              ? formatCurrency(r[c.key] as number)
                              : r[c.key] == null || r[c.key] === ""
                              ? "—"
                              : String(r[c.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
