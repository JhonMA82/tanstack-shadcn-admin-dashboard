import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function {{PASCAL_NAME}}Activity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Replace this placeholder with the approved operational or analytical content.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground text-sm">No activity data connected.</p>
        </div>
      </CardContent>
    </Card>
  );
}
