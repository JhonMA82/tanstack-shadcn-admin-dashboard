# Kanban capsule

> Distilled from `src/routes/(main)/dashboard/kanban/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/kanban/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/kanban/-components/`
>   (`kanban.tsx`, `kanban-column.tsx`, `task-card.tsx`,
>   `sortable-task-card.tsx`, `types.ts`, `utils.ts`, `data.ts`)

## Use when

- Building a drag-and-drop status board: tasks, tickets, hiring, deals.
- Columns represent workflow states and cards move between them.
- Card order inside a column carries meaning.
- Users need WIP awareness at a glance (column counts, overloaded states).
- The board owns the full content width, edge to edge.
- Keyboard and pointer users must reach the same move operations.

## Do not use when

- A table with status filters answers the need (use tasks or users
  capsules for dense sortable collections).
- The workflow is strictly linear with no reordering (a stepper or list
  fits better).
- Cards hold heavy detail; boards show summaries, detail lives in a dialog
  or record screen.
- Only two states exist; a two-list split is simpler than board machinery.
- Touch drag cannot be made reliable; provide explicit move actions first.

## Information hierarchy

1. **Board toolbar.** Title or scope line, view options, and New Card
   action. Creation and scope before the columns.
2. **Columns.** One `KanbanColumn` per state: header with name plus count,
   then stacked cards. Left-to-right order matches workflow order.
3. **Cards.** `TaskCard` summaries: title, key metadata (assignee,
   due, labels), and drag handle affordance. Enough to triage, never the
   full record.
4. **Card detail.** Selection opens a dialog or drawer with full fields and
   comments. The board stays mounted underneath.
5. **Overflow columns.** Horizontal scroll with sticky column headers keeps
   wide boards navigable; counts stay visible while scrolling cards.

## Composition

`route.tsx` renders full-bleed; `Kanban` owns toolbar, columns, and drag:

```text
Page (data-content-padding="false")
└── Kanban (initialBoard)
    ├── toolbar (scope + view options + New Card)
    ├── horizontal column track
    │   └── KanbanColumn per state
    │       ├── column header (name + count + menu)
    │       └── SortableTaskCard list
    │           └── TaskCard (summary)
    └── card detail dialog
```

- `data-content-padding="false"` lets the board use the full content width;
  columns manage their own internal padding.
- `types.ts` owns `Board`, `Column`, and `Card` shapes; `utils.ts` owns
  move and reorder helpers; `data.ts` holds the demo board.
- `SortableTaskCard` wraps `TaskCard` with sortable behavior so the card
  stays presentational and testable without drag.
- Column menus hold rename, limit, and archive actions; card menus hold
  edit, move-to, and delete.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `Kanban` | scroll area, `button`, `tabs` | Board shell with toolbar and track |
| `KanbanColumn` | `badge`, `separator`, `button` | Header count plus card stack |
| `TaskCard` | `card`, `avatar`, `badge` | Title, assignee, due, labels |
| `SortableTaskCard` | drag sortable wrapper | Drag behavior only; delegates visuals |
| Detail dialog | `dialog`, `field`, `button` | Full record with comments and history |
| View options | `input-group`, `button-group` | Filter query plus density or grouping |

- Semantic tokens only; state meaning travels in column headers and badge
  text, never color alone.
- Dragging state pairs elevation with an accessible announcement ("Card
  moved to In Progress"), not visual feedback alone.
- Counts render as text ("3") beside names so WIP reads without counting.
- Focus returns to the triggering card when detail or menus close.

## Required states

- Loading: skeleton columns with counts hidden until data arrives; toolbar
  stays mounted.
- Empty board: zero state with New Card plus template actions.
- Empty column: drop-target placeholder naming the state, not a collapsed
  strip.
- No results: filtered board names the query with a clear action.
- Drag failure: card returns to origin with an announced error; server
  state wins on conflict.
- Error: board-level error with retry; cached board stays interactive when
  available.
- Permission denied: viewers drag nothing; move affordances hide with one
  explanation.
- Overflow: columns scroll vertically inside fixed headers; the track
  scrolls horizontally with visible affordances.
- Viewports: fewer visible columns on narrow screens with snap scrolling;
  detail becomes full-screen dialog.
- Themes: drag elevation and drop-target outlines verified in both modes.

## SSR notes

- `route.tsx` is SSR-safe; the board renders the initial column layout
  from server-provided props.
- Drag libraries initialize in effects after hydration; the server render
  shows a static, keyboard-operable board.
- Every drag has a keyboard equivalent (move-to menu with state list) that
  works without pointer input or hydration.
- Moves call validated server functions with optimistic updates that
  reconcile against the response; conflicts revert with announcement.
- Filter query state lives in search params when board views must be
  shareable; validate params before applying.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { initialBoard } from "./-components/data";
import { Kanban } from "./-components/kanban";

export const Route = createFileRoute("/(main)/dashboard/kanban")({
  component: Page,
});

function Page() {
  return (
    <div data-content-padding="false">
      <Kanban initialBoard={initialBoard} />
    </div>
  );
}
```

Board shape (distilled):

```tsx
// -components/kanban.tsx (shape, distilled)
export function Kanban({ initialBoard }: { initialBoard: Board }) {
  // Board, filter, and selection state live here.
  // Drag sensors bind in effects; keyboard move-to works everywhere.
  return (
    <div className="flex h-full flex-col gap-4">
      {/* toolbar: scope + view options + New Card */}
      {/* horizontal track of KanbanColumn */}
      {/* card detail dialog */}
    </div>
  );
}
```

## Allowed deviations

- Replace card fields with the product's summary contract; keep title,
  owner, due-or-value, and state visible.
- Add WIP limits with explicit over-limit styling plus text, not color
  alone.
- Persist board scope and filters in search params when views must be
  shared between teammates.
- Swap the detail presentation (dialog, drawer, record link) to match the
  product's overlay conventions.
- Add swimlanes only when a second grouping dimension is the actual
  requirement; default to flat columns.
- Promote board primitives to shared code only after a second board
  consumes them.
