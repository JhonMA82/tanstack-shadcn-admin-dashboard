import { Skeleton } from "@/components/ui/skeleton";

export function {{PASCAL_NAME}}Pending() {
  return (
    <div className="space-y-6" aria-label="Loading {{TITLE_NAME}}">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
