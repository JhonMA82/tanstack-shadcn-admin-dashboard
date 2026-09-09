import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

import { {{PASCAL_SINGULAR}}Table } from "./-components/{{ENTITY_SINGULAR}}-table";
import { {{PASCAL_SINGULAR}}Error } from "./-components/{{ENTITY_PLURAL}}-error";
import { {{PASCAL_PLURAL}}Pending } from "./-components/{{ENTITY_PLURAL}}-pending";
import { {{CAMEL_PLURAL}} } from "./-data/{{ENTITY_PLURAL}}";

export const Route = createFileRoute("/(main)/dashboard/{{ROUTE_NAME}}")({
  component: {{PASCAL_PLURAL}}Page,
  pendingComponent: {{PASCAL_PLURAL}}Pending,
  errorComponent: {{PASCAL_SINGULAR}}Error,
});

function {{PASCAL_PLURAL}}Page() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">{{TITLE_PLURAL}}</h1>
          <p className="text-muted-foreground">
            {{DESCRIPTION}}
          </p>
        </div>
        <Button nativeButton={false} render={<Link to="/dashboard/{{ROUTE_NAME}}/new" />}>
          Create {{TITLE_SINGULAR}}
        </Button>
      </header>

      <{{PASCAL_SINGULAR}}Table data={{{CAMEL_PLURAL}}} />
    </div>
  );
}
