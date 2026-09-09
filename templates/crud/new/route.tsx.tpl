import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { {{PASCAL_SINGULAR}}Form } from "../-components/{{ENTITY_SINGULAR}}-form";
import { {{PASCAL_SINGULAR}}Error } from "../-components/{{ENTITY_PLURAL}}-error";
import { {{PASCAL_PLURAL}}Pending } from "../-components/{{ENTITY_PLURAL}}-pending";

export const Route = createFileRoute("/(main)/dashboard/{{ROUTE_NAME}}/new")({
  component: New{{PASCAL_SINGULAR}}Page,
  pendingComponent: {{PASCAL_PLURAL}}Pending,
  errorComponent: {{PASCAL_SINGULAR}}Error,
});

function New{{PASCAL_SINGULAR}}Page() {
  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create {{TITLE_SINGULAR}}</CardTitle>
          <CardDescription>Connect this form to an approved server mutation before production use.</CardDescription>
        </CardHeader>
        <CardContent>
          <{{PASCAL_SINGULAR}}Form />
        </CardContent>
      </Card>
    </div>
  );
}
