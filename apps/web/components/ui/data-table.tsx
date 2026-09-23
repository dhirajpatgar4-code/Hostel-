"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Hide on mobile card view */
  hideOnMobile?: boolean;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  pageSize = 10,
  emptyState,
  onRowClick,
  /** On mobile, always render a compact table instead of card list */
  forceTableMobile = false,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  pageSize?: number;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  forceTableMobile?: boolean;
}) {
  const [page, setPage] = React.useState(1);
  React.useEffect(() => { setPage(1); }, [rows.length]);

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  const slice = rows.slice((current - 1) * pageSize, current * pageSize);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (!total) return <>{emptyState}</>;

  return (
    <div className="space-y-3">
      {/* Mobile card view — only when not forcing table */}
      {!forceTableMobile && (
        <div className="md:hidden space-y-2">
          {slice.map((row) => (
            <button
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "w-full text-left rounded-lg border bg-card p-3 space-y-2",
                onRowClick && "hover:bg-muted/40 active:bg-muted/60"
              )}
            >
              {columns
                .filter((c) => !c.hideOnMobile)
                .map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground shrink-0 pt-0.5">
                      {typeof c.header === "string" ? c.header : c.key}
                    </span>
                    <span className="text-sm text-right flex-1 min-w-0">{c.cell(row)}</span>
                  </div>
                ))}
            </button>
          ))}
        </div>
      )}

      {/* Compact mobile table (inventory mode) OR desktop table */}
      <div className={cn(
        "overflow-x-auto rounded-lg border",
        forceTableMobile ? "block" : "hidden md:block"
      )}>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-3 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-t",
                  onRowClick && "cursor-pointer hover:bg-muted/40"
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-3 py-2.5 align-middle", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs sm:text-sm">
            {current} / {pages} · {total} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={current === pages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
