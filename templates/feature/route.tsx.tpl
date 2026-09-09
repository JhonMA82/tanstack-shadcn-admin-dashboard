import { createFileRoute } from "@tanstack/react-router";

import { {{PASCAL_NAME}}Error } from "./-components/{{ROUTE_NAME}}-error";
import { {{PASCAL_NAME}}Overview } from "./-components/{{ROUTE_NAME}}-overview";
import { {{PASCAL_NAME}}Pending } from "./-components/{{ROUTE_NAME}}-pending";

export const Route = createFileRoute("/(main)/dashboard/{{ROUTE_NAME}}")({
  component: {{PASCAL_NAME}}Page,
  pendingComponent: {{PASCAL_NAME}}Pending,
  errorComponent: {{PASCAL_NAME}}Error,
});

function {{PASCAL_NAME}}Page() {
  return <{{PASCAL_NAME}}Overview />;
}
