# Roles capsule

> Distilled from `src/routes/(main)/dashboard/roles/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/roles/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/roles/-components/`
>   (`roles.tsx`, `roles-table/` with columns, data, toolbar)

## Use when

- Building a role and permission administration screen.
- The primary question is "who can do what".
- Roles list with member counts, permission scope badges, and row actions
  (edit, duplicate, assign, archive).
- A permission matrix or scope summary explains each role without opening
  an editor.
- Creation (New Role) plus search and scope filters complete triage.
- The audience is administrators, with denied states for everyone else.

## Do not use when

- Managing people rather than access (use the users capsule).
- Assigning one person's roles (a role picker on the profile screen fits).
- Permissions are simple flags; a settings toggle list replaces this shell.
- End users browse this screen; it is admin-only by design.
- Audit history dominates (graft an activity panel instead of rebuilding).

## Information hierarchy

1. **Admin header.** Title plus policy line; New Role (primary) and
   optional Export actions. Creation first, with scope explicit.
2. **Toolbar.** Search input plus scope or status filters. Narrows roles in
   place.
3. **Roles table.** Rows: role name plus description, member count, key
   permission badges, status, updated date, row actions. Comparability
   across roles is the point.
4. **Permission detail.** Selection expands scope summary or opens the role
   editor: capability groups with granted versus denied marks. Evidence
   behind the badges.
5. **Guard notice.** `alert` for restricted viewers explaining admin-only
   access with a contact. One explanation, then nothing privileged renders.

## Composition

`route.tsx` renders one shell; `Roles` owns header, toolbar, and table:

```text
Page
└── Roles (roles)
    ├── header (title + line + New Role)
    ├── alert slot (permission notice when denied)
    ├── toolbar (search + scope filters)
    └── roles-table (TanStack Table)
        ├── columns (name + scope badges + counts + status + actions)
        └── row expansion or editor dialog
```

- Table follows the data-table pattern: toolbar, sorting, selection,
  pagination, and empty states.
- `roles-table/data` holds typed demo roles; derived products replace it
  with admin queries behind the same shape.
- Destructive actions (delete, demote) confirm and require re-auth where
  policy demands; results announce to screen readers.
- Editors open as dialogs from row actions; the table stays mounted.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `Roles` shell | `button`, `alert`, `tabs` | Header plus guard plus toolbar layout |
| Toolbar | `input-group`, `select`, `button` | Search plus scope and status filters |
| `roles-table` | TanStack Table, `table`, `badge`, `checkbox` | Name, scopes, counts, status, actions |
| Scope badges | `badge` | Capability names as text, never color alone |
| Editor dialog | `dialog`, `field`, `checkbox` | Capability groups with grant toggles |
| Guard notice | `alert` | Admin-only explanation with contact |

- Semantic tokens only; grant versus deny pairs check/cross icons with
  text labels.
- Member counts render as numerals with links to filtered member views.
- Search input carries a label; filter selects announce changes.
- Sensitive capability names render for permitted admins only.

## Required states

- Loading: skeleton header plus table skeleton with fixed rows; toolbar
  stays mounted.
- Empty roles: zero state with New Role action (admins) or contact note.
- No results: filtered message naming query and filters with clear action.
- No selection: detail invites row selection; never blank.
- Error: table error with retry; header and toolbar stay usable.
- Permission denied: guard alert replaces the table; no capability data
  leaks into props or markup.
- Overflow: long role names and scope lists truncate with expansion;
  badge lists wrap with "+N more".
- Viewports: table scrolls inside its card with sticky header; editor
  becomes full-screen dialog on mobile.
- Themes: grant/deny marks and badges verified in both modes.

## SSR notes

- `route.tsx` is SSR-safe; the first page of roles renders from
  server-provided props after a server-side permission check.
- Denied viewers receive the guard state from the server; privileged rows
  never hydrate later into view.
- Table sort, filter, and pagination hydrate client-side; promote to search
  params when role views must be shareable.
- Mutations (create, assign, archive) call validated admin server functions
  with confirmation; optimistic updates reconcile per row.
- Editor dialogs open from handlers; form state initializes from the
  selected row once per open.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Roles } from "./-components/roles";
import { roles } from "./-components/roles-table/data";

export const Route = createFileRoute("/(main)/dashboard/roles")({
  component: Page,
});

function Page() {
  return <Roles roles={roles} />;
}
```

Shell shape (distilled):

```tsx
// -components/roles.tsx (shape, distilled)
export function Roles({ roles }: { roles: Role[] }) {
  // Search, filters, selection, and editor state live here.
  // Permission gating resolves on the server before this renders.
  return (
    <div className="flex flex-col gap-4">
      {/* header: title + line + New Role */}
      {/* guard alert when denied */}
      {/* toolbar: search + scope filters */}
      {/* roles-table with expansion + editor dialog */}
    </div>
  );
}
```

## Allowed deviations

- Replace scope vocabulary with the product's permission model; keep the
  name, scopes, counts, status, actions row contract.
- Add a permission matrix view beside the table when comparison across
  roles is the real task; keep the table as default.
- Promote search and filters to the URL when admin views must be shared.
- Add assignment drawers (members per role) only beside real membership
  capability.
- Strengthen destructive confirmations per policy; never soften them for
  convenience.
- Promote role primitives to shared code only after a second admin surface
  consumes them.
