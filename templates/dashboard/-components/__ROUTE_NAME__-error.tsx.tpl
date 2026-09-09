import { Button } from "@/components/ui/button";

interface {{PASCAL_NAME}}DashboardErrorProps {
  error: Error;
  reset: () => void;
}

export function {{PASCAL_NAME}}Error({ error, reset }: {{PASCAL_NAME}}DashboardErrorProps) {
  return (
    <section className="space-y-4" role="alert" aria-labelledby="{{ROUTE_NAME}}-error-title">
      <div className="space-y-1">
        <h1 id="{{ROUTE_NAME}}-error-title" className="text-2xl font-semibold tracking-tight">
          Unable to load {{TITLE_NAME}}
        </h1>
        <p className="text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
      </div>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
