import { createFileRoute } from "@tanstack/react-router";

import { initialBoard } from "./-components/data";
import { Kanban } from "./-components/kanban";

export const Route = createFileRoute("/(main)/dashboard/kanban")({
  validateSearch: (search: Record<string, unknown>): { view: "board" | "list" | "table" } => ({
    view: search.view === "list" || search.view === "table" ? search.view : "board",
  }),
  component: Page,
});

function Page() {
  return (
    <div data-content-padding="false">
      <Kanban initialBoard={initialBoard} />
    </div>
  );
}
