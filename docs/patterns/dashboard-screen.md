# Dashboard screen pattern

## Use when

Creating a new overview, analytics, operational, or executive dashboard.

## Recommended structure

```text
src/routes/(main)/dashboard/<dashboard>/
├── -components/
│   ├── <dashboard>-header.tsx
│   ├── <dashboard>-kpis.tsx
│   ├── <dashboard>-activity.tsx
│   ├── <dashboard>-pending.tsx
│   └── <dashboard>-error.tsx
└── route.tsx
```

`route.tsx` registers the file route with `createFileRoute("/(main)/dashboard/<dashboard>")`
and wires `component`, `pendingComponent`, and `errorComponent` from `-components/`.

## Information design

Define before choosing widgets:

- Primary user question.
- Decision supported by the screen.
- Information hierarchy.
- Data freshness.
- Primary action.
- Responsive collapse order.
- Chart alternatives and textual context.

Avoid a uniform card grid when information importance differs.

## Architecture

- `route.tsx` loads and composes data in an SSR-safe way.
- Interactive charts, filters, or controls are focused components with browser APIs
  isolated in effects, guarded client code, `<ClientOnly>`, or `createClientOnlyFn`.
- Route-private widgets remain under `-components/`.
- Dashboard-wide shell elements require multiple consumers before promotion.

## Required states

- Loading with stable layout.
- No data.
- Partial data.
- Query or integration failure.
- Permission denied.
- Long labels and large values.
- Small and large viewports.
- Light and dark themes.

## Worked example

Create an `operations` overview dashboard (navigation is registered by default):

```bash
npm run generate:dashboard -- operations
```

> As with every generator, keep the space after `--` so npm forwards the
> arguments; without it the generator prints usage and creates nothing.

Expected outcome:

```text
src/routes/(main)/dashboard/operations/
├── -components/
│   ├── operations-header.tsx
│   ├── operations-kpis.tsx
│   ├── operations-activity.tsx
│   ├── operations-pending.tsx
│   └── operations-error.tsx
└── route.tsx
```

- An `Operations` entry is added to the sidebar under the `Dashboards` group
  (`/dashboard/operations`, `LayoutDashboard` icon).
- `docs/ai/generated-context.md` is regenerated.
- Placeholder metrics compile but are not product data: replace them with the
  approved server boundary before shipping.

## Scenarios

- **Executive variant.** `--nav-title "Ops overview" --nav-icon Gauge` keeps the
  route (`operations`) while presenting the approved label and icon.
- **Hidden until ready.** `--no-nav` scaffolds the route without sidebar
  registration, for dashboards behind a feature flag or pending approval.
- **Seeded narrative.** `--description "Fleet health at a glance."` sets the
  header copy so the information hierarchy starts from the approved question.
- **Name collision.** Existing routes are never overwritten unless `--force` is
  passed explicitly.
- **Batch scaffolding.** Use `--no-context` for consecutive runs, then a single
  `npm run ai:context` at the end.
- **Wrong generator.** A screen that is mostly one table with row actions is a
  CRUD candidate (`generate:crud`); a bounded tool without overview metrics is a
  feature (`generate:feature`). Do not force the dashboard shape onto either.

## Verification

Confirm heading hierarchy, visual priority, responsive order, keyboard access, chart
labels, route registration, and no `use client` directive in `route.tsx`.
