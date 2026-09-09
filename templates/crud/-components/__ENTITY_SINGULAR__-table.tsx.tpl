import { useState } from "react";

import { type ColumnFiltersState, useTable } from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dataTableFeatures } from "@/lib/data-table-features";

import type { {{PASCAL_SINGULAR}} } from "../-data/{{ENTITY_PLURAL}}";
import { {{CAMEL_SINGULAR}}Columns } from "./{{ENTITY_SINGULAR}}-columns";

interface {{PASCAL_SINGULAR}}TableProps {
  data: {{PASCAL_SINGULAR}}[];
}

export function {{PASCAL_SINGULAR}}Table({ data }: {{PASCAL_SINGULAR}}TableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: {{CAMEL_SINGULAR}}Columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
  });

  return (
    <section className="space-y-4" aria-label="{{TITLE_PLURAL}} table">
      <Input
        aria-label="Filter {{TITLE_PLURAL}}"
        placeholder="Filter by name..."
        value={(table.getColumn("name")?.getFilterValue() as string | undefined) ?? ""}
        onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={{{CAMEL_SINGULAR}}Columns.length} className="h-24 text-center">
                  No {{TITLE_PLURAL}} found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
