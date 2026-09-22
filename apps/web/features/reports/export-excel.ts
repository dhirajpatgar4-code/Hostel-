import * as XLSX from "xlsx";
import type { ReportPayload } from "./types";

export function exportReportToExcel(payload: ReportPayload) {
  const wb = XLSX.utils.book_new();

  // Sheet 1 — summary
  const summaryData = [
    [payload.hostel.name],
    [payload.hostel.address ?? ""],
    [payload.hostel.phone ?? "", payload.hostel.email ?? ""],
    [],
    [payload.title],
    [payload.subtitle],
    [`Generated: ${new Date(payload.generatedAt).toLocaleString("en-IN")}`],
    [],
    ["Summary"],
    ...payload.summary.map((s) => [s.label, s.value]),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Sheet 2 — data table
  const header = payload.columns.map((c) => c.label);
  const body = payload.rows.map((r) => payload.columns.map((c) => r[c.key] ?? ""));
  const wsData = XLSX.utils.aoa_to_sheet([header, ...body]);
  XLSX.utils.book_append_sheet(wb, wsData, "Data");

  // Column widths
  wsData["!cols"] = payload.columns.map(() => ({ wch: 18 }));

  const fname = `${payload.kind}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}
