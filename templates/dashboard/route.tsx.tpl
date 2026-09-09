import { createFileRoute } from "@tanstack/react-router";

import { {{PASCAL_NAME}}Activity } from "./-components/{{ROUTE_NAME}}-activity";
import { {{PASCAL_NAME}}Error } from "./-components/{{ROUTE_NAME}}-error";
import { {{PASCAL_NAME}}Header } from "./-components/{{ROUTE_NAME}}-header";
import { {{PASCAL_NAME}}Kpis } from "./-components/{{ROUTE_NAME}}-kpis";
import { {{PASCAL_NAME}}Pending } from "./-components/{{ROUTE_NAME}}-pending";

export const Route = createFileRoute("/(main)/dashboard/{{ROUTE_NAME}}")({
  component: {{PASCAL_NAME}}DashboardPage,
  pendingComponent: {{PASCAL_NAME}}Pending,
  errorComponent: {{PASCAL_NAME}}Error,
});

function {{PASCAL_NAME}}DashboardPage() {
  return (
    <div className="space-y-6">
      <{{PASCAL_NAME}}Header />
      <{{PASCAL_NAME}}Kpis />
      <{{PASCAL_NAME}}Activity />
    </div>
  );
}
