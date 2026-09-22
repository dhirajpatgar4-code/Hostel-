export function formatCurrency(n: number | string | null | undefined, currency = "INR") {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(v || 0);
}

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function monthName(m: number) {
  return new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "long" });
}

export function maskAadhaar(v: string | null) {
  if (!v) return "—";
  const digits = v.replace(/\D/g, "");
  if (digits.length !== 12) return v;
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

export function maskPhone(v: string | null) {
  if (!v) return "—";
  const digits = v.replace(/\D/g, "");
  if (digits.length < 4) return v;
  return `XXXXXX${digits.slice(-4)}`;
}
