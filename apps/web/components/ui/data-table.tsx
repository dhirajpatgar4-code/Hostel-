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
};

export function DataTable<T extends { id: string }>({
  columns, rows, loading, pageSize = 10, emptyState, onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  pageSize?: number;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
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
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (!total) return <>{emptyState}</>;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-3 font-medium text-muted-foreground", c.className)}>
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
                className={cn("border-t", onRowClick && "cursor-pointer hover:bg-muted/40")}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
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
          <span className="text-muted-foreground">
            Page {current} of {pages} · {total} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={current === pages}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}