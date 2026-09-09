import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import type { DataTableFeatures } from "@/lib/data-table-features";

import type { {{PASCAL_SINGULAR}} } from "../-data/{{ENTITY_PLURAL}}";

export const {{CAMEL_SINGULAR}}Columns: ColumnDef<DataTableFeatures, {{PASCAL_SINGULAR}}>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <span className="text-muted-foreground capitalize">{row.original.status}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link to="/dashboard/{{ROUTE_NAME}}/$id" params={{ id: row.original.id }} />}
      >
        Edit
      </Button>
    ),
  },
];
