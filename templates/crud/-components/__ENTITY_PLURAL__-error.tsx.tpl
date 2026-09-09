import type { ErrorComponentProps } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function {{PASCAL_SINGULAR}}Error({ error, reset }: ErrorComponentProps) {
  return (
    <section className="space-y-4" role="alert" aria-labelledby="{{ROUTE_NAME}}-error-title">
      <div className="space-y-1">
        <h1 id="{{ROUTE_NAME}}-error-title" className="font-semibold text-2xl tracking-tight">
          Unable to load {{TITLE_PLURAL}}
        </h1>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : "An unexpected error occurred."}
        </p>
      </div>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
