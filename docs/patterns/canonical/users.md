# Users capsule

> Distilled from `src/routes/(main)/dashboard/users/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/users/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/users/-components/`
>   (`users.tsx`, `users-columns.tsx`, `users-table.tsx`, `data.tsx`)

## Use when

- Building a people administration collection: members, customers, staff.
- The primary question is "who is here and what is their state".
- Rows carry identity cells (avatar plus name plus contact) with status,
  role, and date columns.
- Invite or add plus search, role filter, and status filter complete triage.
- Row actions (view, edit, suspend, remove) apply per person.
- The audience is administrators or managers with scoped permissions.

## Do not use when

- Access shapes dominate identity (use the roles capsule).
- One person's record is the screen (use the profile capsule).
- People pick themselves (a directory or picker widget suffices).
- The collection is work, files, or orders (use tasks, file-manager, or
  ecommerce capsules).
- Membership is open with no states; a simple list replaces this shell.

## Information hierarchy

1. **Directory header.** Title plus scope line and member count; Invite
   (primary) plus Export actions. Growth plus governance in one row.
2. **Toolbar.** Search input (name or contact), role filter, status filter,
   view options. Narrows people in place.
3. **Users table.** Identity cell first (avatar, name, email), then role
   badge, status badge, joined date, row actions. Identity anchors every
   row; state follows.
4. **Bulk bar.** Appears with selection: assign role, activate, suspend,
   remove with confirmation. Multi-person work with audit awareness.
5. **Pagination footer.** Page controls with counts; selection semantics
   documented where pages turn.

## Composition

`route.tsx` renders one shell; `Users` owns header, toolbar, and table:

```text
Page
└── Users (users)
    ├── header (title + count + Invite + Export)
    ├── toolbar (search + role + status + options)
    ├── UsersTable (users-columns.tsx)
    ├── bulk bar (on selection)
    └── pagination footer
```

- `data.tsx` holds typed demo users; derived products replace it with
  paginated directory queries behind the same row shape.
- `users-columns.tsx` centralizes cell definitions so identity, role, and
  status render identically for sort, filter, and export.
- Table follows the data-table pattern: sorting, selection, density,
  pagination, and empty states.
- Invite opens a dialog with validated fields; row actions open record,
  edit, or confirm flows without unmounting the table.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| Header | `button`, `badge` | Title, live count, Invite, Export |
| Toolbar | `input-group`, `select`, `button` | Search plus role and status filters |
| `UsersTable` | TanStack Table, `table`, `checkbox` | Sortable people columns with selection |
| Identity cell | `avatar` | Avatar with initials fallback plus name |
| Role cell | `badge` | Role as text plus variant |
| Status cell | `badge` | Active, invited, suspended as text |
| Row actions | dropdown `menu`, `button` | View, edit, suspend, remove |
| Invite dialog | `dialog`, `field`, `input` | Validated invite with role select |

- Semantic tokens only; status pairs text with variant, never color alone.
- Avatars always carry `alt` or initials fallback; decorative icons hide.
- Invite and destructive actions confirm; results announce to screen
  readers.
- Contact values truncate with full value on hover; never wrap rows tall.

## Required states

- Loading: skeleton header plus table skeleton with fixed rows; toolbar
  stays mounted.
- Empty directory: zero state with Invite action (admins) or contact note.
- No results: filtered message naming query and filters with clear action.
- Pending invites: explicit "Invited" status with resend and revoke, not
  silent rows.
- Error: table error with retry; toolbar stays usable.
- Permission denied: restricted columns mask while structure remains;
  Invite and destructive actions hide per role.
- Overflow: long names and contacts truncate; full value on hover.
- Viewports: table scrolls inside its card with sticky header; invite
  becomes full-screen dialog on mobile.
- Themes: avatar fallbacks and badges verified in both modes.

## SSR notes

- `route.tsx` is SSR-safe; the first page renders from server-provided
  props after server-side scope checks.
- Search, filter, sort, and pagination live in validated search params
  when directory views must be shareable.
- Restricted columns resolve on the server; masked values never hydrate
  into view later.
- Invite and mutation actions call validated admin server functions with
  per-row optimistic updates and rollback.
- Export builds in a handler from the authorized scope, never from rendered
  rows alone.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { users } from "./-components/data";
import { Users } from "./-components/users";

export const Route = createFileRoute("/(main)/dashboard/users")({
  component: Page,
});

function Page() {
  return <Users users={users} />;
}
```

Shell shape (distilled):

```tsx
// -components/users.tsx (shape, distilled)
export function Users({ users }: { users: User[] }) {
  // Search, filters, selection, invite dialog, and bulk state live here.
  return (
    <div className="flex flex-col gap-4">
      {/* header: title + count + Invite + Export */}
      {/* toolbar: search + role + status + options */}
      {/* UsersTable + bulk bar + pagination */}
      {/* invite dialog */}
    </div>
  );
}
```

## Allowed deviations

- Replace person fields with the product's member model; keep the identity,
  role, status, joined, actions contract.
- Add facets (team, plan, region) only for real triage axes; keep search
  plus role plus status default.
- Promote directory state to search params when views must be shared.
- Link identity cells to profile-shaped records instead of growing inline
  detail.
- Strengthen invite and removal confirmations per policy; audit bulk work.
- Promote directory primitives to shared code only after a second people
  surface consumes them.
