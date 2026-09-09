import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function {{PASCAL_NAME}}Overview() {
  return (
    <section className="space-y-6" aria-labelledby="{{ROUTE_NAME}}-title">
      <div className="space-y-1">
        <h1 id="{{ROUTE_NAME}}-title" className="font-semibold text-2xl tracking-tight">
          {{TITLE_NAME}}
        </h1>
        <p className="text-muted-foreground">{{DESCRIPTION}}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature scaffold</CardTitle>
          <CardDescription>
            Replace this placeholder with the approved information hierarchy and states.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Keep route-owned components inside this feature until reuse is proven.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
