import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  { label: "Primary metric", value: "—" },
  { label: "Secondary metric", value: "—" },
  { label: "Attention required", value: "—" },
];

export function {{PASCAL_NAME}}Kpis() {
  return (
    <section className="grid gap-4 md:grid-cols-3" aria-label="{{TITLE_NAME}} key metrics">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">{metric.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-2xl tabular-nums">{metric.value}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
