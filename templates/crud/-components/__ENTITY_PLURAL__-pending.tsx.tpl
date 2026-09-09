import { Skeleton } from "@/components/ui/skeleton";

export function {{PASCAL_PLURAL}}Pending() {
  return (
    <div className="space-y-6" aria-label="Loading {{TITLE_PLURAL}}">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-9 w-80 max-w-full" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
