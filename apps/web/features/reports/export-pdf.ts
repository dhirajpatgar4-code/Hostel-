import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportPayload } from "./types";

export async function exportReportToPdf(payload: ReportPayload) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(payload.hostel.name, margin, 50);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let y = 68;
  if (payload.hostel.address) { doc.text(payload.hostel.address, margin, y); y += 12; }
  const contact = [payload.hostel.phone, payload.hostel.email].filter(Boolean).join(" · ");
  if (contact) { doc.text(contact, margin, y); y += 12; }

  // Divider
  y += 6;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);

  // Title
  y += 24;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(payload.title, margin, y);

  y += 16;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(payload.subtitle, margin, y);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Generated: ${new Date(payload.generatedAt).toLocaleString("en-IN")}`,
    pageWidth - margin, 50,
    { align: "right" }
  );
  doc.setTextColor(0);

  // Summary
  y += 24;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, y);

  y += 8;
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: payload.summary.map((s) => [s.label, String(s.value)]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [240, 240, 240], textColor: 20 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  // Data table
  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 24;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Details", margin, y);

  autoTable(doc, {
    startY: y + 8,
    head: [payload.columns.map((c) => c.label)],
    body: payload.rows.map((r) =>
      payload.columns.map((c) => {
        const v = r[c.key];
        return v == null ? "" : String(v);
      })
    ),
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
    headStyles: { fillColor: [30, 60, 120], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: margin, right: margin },
    columnStyles: Object.fromEntries(
      payload.columns.map((c, i) => [i, { halign: c.align ?? "left" }])
    ),
  });

  // Footer on each page
  // @ts-ignore
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `${payload.hostel.name} — Page ${i} of ${pageCount}`,
      pageWidth / 2, doc.internal.pageSize.getHeight() - 20,
      { align: "center" }
    );
    doc.setTextColor(0);
  }

  const fname = `${payload.kind}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}
