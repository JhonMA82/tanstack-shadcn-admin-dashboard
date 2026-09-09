# Feature pattern

## Use when

Creating a bounded dashboard capability that is not specifically a dashboard overview or a
full CRUD module.

## Recommended structure

```text
src/routes/(main)/dashboard/<feature>/
├── -components/
│   └── <feature>-overview.tsx
└── route.tsx
```

`route.tsx` registers the file route with `createFileRoute("/(main)/dashboard/<feature>")`
and wires `component`, `pendingComponent`, and `errorComponent` from `-components/`.

Add `-schemas/`, `-data/`, or `-lib/` only when the feature requires them.

## Design checklist

Define:

- User outcome.
- Route and navigation placement.
- Permissions.
- Data source and freshness.
- SSR/interaction boundary.
- URL, local, and shared state.
- Required states.
- Accessibility behavior.
- Canonical example and deviations.

## Implementation rules

- Keep `route.tsx` SSR-safe and composition-focused. Never add `"use client"` and never
  touch browser APIs at module scope or during render.
- Keep route-owned code private.
- Use current shared primitives.
- Do not create a shared abstraction without proven consumers.
- Validate external and user input at trust boundaries.
- Add navigation only when approved. Sidebar entries use `url: AppPath` (groups stripped,
  for example `/dashboard/reports`) and `icon: LucideIcon` component references.

## Worked example

Create a `reports` feature with sidebar navigation:

```bash
npm run generate:feature -- reports --nav
```

> The space after `--` matters: npm only forwards arguments placed after it.
> `npm run generate:feature --reports --nav` (no space) forwards nothing, so the
> generator prints its usage text and creates no files.

Expected outcome:

```text
src/routes/(main)/dashboard/reports/
├── -components/
│   ├── reports-overview.tsx
│   ├── reports-pending.tsx
│   └── reports-error.tsx
└── route.tsx
```

- A `Reports` entry is added to the sidebar under the `Pages` group
  (`/dashboard/reports`, `SquareArrowUpRight` icon).
- `docs/ai/generated-context.md` is regenerated.
- The scaffold is intentionally minimal: implement the approved behavior in the
  generated files before adding abstractions.

## Scenarios

- **Approved navigation.** Use `--nav` as in the example when the route is
  approved for the sidebar. Without `--nav`, the route exists but is unreachable
  from navigation until registered.
- **Custom placement.** `--nav-group Dashboards --nav-icon ChartNoAxesColumn --nav-title "Team reports"`
  controls the sidebar group, icon, and label without touching generated code.
- **Documented intent.** `--description "Weekly exportable team activity."` seeds
  the generated overview copy with the approved outcome.
- **Name collision.** Re-running for an existing route fails instead of
  overwriting. Pass `--force` only when discarding the previous scaffold is
  intended.
- **Batch scaffolding.** Pass `--no-context` when generating several routes in a
  row, then run `npm run ai:context` once at the end.
- **Invalid name.** Names must be kebab-case (`reports`, not `Reports` or
  `team_reports`); the generator rejects anything else.
- **Wrong generator.** Prefer `generate:dashboard` for overview/analytics screens
  and `generate:crud` for entity list/create/edit flows. A feature that grows a
  second entity usually means a missing CRUD scaffold, not a bigger feature.

## Verification

Check functional behavior, loading, error, empty, permissions, responsive layout, theme,
keyboard access, and repository quality gates.
