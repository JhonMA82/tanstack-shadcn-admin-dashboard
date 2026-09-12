# Tasks capsule

> Distilled from `src/routes/(main)/dashboard/tasks/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/tasks/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/tasks/-components/`
>   (`tasks.tsx`, `columns.tsx`, `tasks-toolbar.tsx`,
>   `task-status-filter.tsx`, `task-priority-filter.tsx`, `data.ts`)

## Use when

- Building a task, ticket, or issue collection with triage needs.
- The primary question is "what needs doing, ordered by what matters".
- Faceted filtering (status, priority) plus text search slices the queue.
- Columns carry domain cells: title with labels, status badge, priority
  marker, assignee, due date, row actions.
- Density and view options help operators scan hundreds of rows.
- The audience works the queue to zero.

## Do not use when

- A board with drag states fits better (use the kanban capsule).
- Personal day planning is the job (use the productivity capsule).
- Tasks attach to one record; an embedded list there replaces this screen.
- The collection is people, files, or orders rather than work items (use
  users, file-manager, or ecommerce capsules).
- Fewer than twenty items exist; filters would be decoration.

## Information hierarchy

1. **Queue header.** Greeting title plus scope line ("Here's a list of
   your tasks for this month"). Scope before rows.
2. **Toolbar.** Search input, status filter, priority filter, view options,
   and New Task action. Every triage control in one row that wraps.
3. **Data table.** `Tasks` shell with `columns.tsx`: selection checkbox,
   title plus labels, status, priority, assignee, due, actions. Reading
   order matches triage priority.
4. **Bulk bar.** Appears with selection: complete, reassign, set priority,
   delete with confirmation. Multi-row work without row-by-row edits.
5. **Pagination footer.** Page controls with row counts; selection
   survives page turns where the table supports it.

## Composition

`route.tsx` owns the greeting; `Tasks` owns toolbar plus table:

```text
Page
├── header (title + scope line)
└── Tasks (data)
    ├── TasksToolbar (search + status + priority + view options + New)
    ├── table (columns.tsx: select + title + status + priority + owner + due)
    ├── bulk bar (on selection)
    └── pagination footer
```

- `data.ts` holds typed demo tasks; derived products replace it with
  paginated queries behind the same row shape.
- `task-status-filter.tsx` and `task-priority-filter.tsx` own faceted
  option lists; the toolbar composes them.
- Filter state belongs in URL search params when queue views must be
  shared; validate every param in the route.
- Table follows the data-table pattern: sorting, selection, density,
  pagination, and empty states.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `TasksToolbar` | `input-group`, `button`, `select` | Search plus faceted filters and options |
| Status filter | faceted control, `badge` | Multi-select states with counts |
| Priority filter | faceted control | Multi-select priorities with markers |
| Table | TanStack Table, `table`, `checkbox` | Sortable columns with selection |
| Status cell | `badge` | State as text plus variant |
| Priority cell | marker plus text | Never color alone; label always present |
| Assignee cell | `avatar` | Name plus avatar with fallback |
| Row actions | dropdown `menu`, `button` | Edit, assign, set priority, delete |

- Semantic tokens only; status and priority pair icon with text labels.
- Due dates use relative helpers near ("Tomorrow") with absolute on hover.
- Overdue rows add text ("Overdue") plus weight, not red alone.
- Toolbar controls carry labels; filter changes announce result counts.

## Required states

- Loading: skeleton toolbar plus table skeleton with fixed rows.
- Empty queue: zero state with New Task action ("All clear" tone where
  the queue is personal).
- No results: filtered message naming query and active facets with a clear
  action.
- Error: table error with retry; toolbar stays usable to pivot filters.
- Permission denied: restricted rows mask while counts remain where
  policy allows; actions hide per role.
- Overflow: long titles truncate with labels wrapping to a second line on
  hover or expansion.
- Viewports: toolbar wraps with `flex-wrap`; table scrolls inside its card
  with sticky header.
- Themes: status and priority contrast verified in both modes.

## SSR notes

- `route.tsx` is SSR-safe; the first page renders from server-provided
  props with validated search params.
- Filter, sort, and pagination state lives in the URL when views must be
  shareable; the server applies them before first paint.
- Faceted counts derive from server aggregates, not the visible page, so
  filters never lie about hidden rows.
- Mutations (complete, reassign, delete) call validated server functions;
  optimistic row updates reconcile per row with rollback.
- Bulk actions confirm destructive scope and announce completion counts.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { tasks } from "./-components/data";
import { Tasks } from "./-components/tasks";

export const Route = createFileRoute("/(main)/dashboard/tasks")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">Here&apos;s a list of your tasks for this month!</p>
      </div>
      <Tasks data={tasks} />
    </div>
  );
}
```

## Allowed deviations

- Replace row fields with the product's work-item model; keep the title,
  status, priority, owner, due, actions contract.
- Add custom facets (project, label, sprint) only for real triage axes;
  keep status plus priority as the default pair.
- Promote filters, sort, and page to search params when queues must be
  shared or bookmarked.
- Add bulk workflows only for genuine multi-row operations with
  confirmation on destructive ones.
- Link rows to record screens instead of growing inline detail.
- Promote queue primitives to shared code only after a second collection
  consumes them.
