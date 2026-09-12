# Default dashboard capsule

> Distilled from `src/routes/(main)/dashboard/default/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail. This is the baseline shell: start here
> unless another capsule clearly fits better.
>
> - Source route: `src/routes/(main)/dashboard/default/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/default/-components/`
>   (`metric-cards.tsx`, `performance-overview.tsx`, `subscriber-overview.tsx`,
>   `recent-customers-table/`, `data.json`)

## Use when

- Building a general executive or overview dashboard with no dominant lens.
- The primary question is "how is the business doing" in one screen.
- Content mixes headline metrics, a performance chart, and a customer list.
- No header actions are needed; the screen reads, then links out.
- The layout must demonstrate neutral theme composition for a new product.
- Nothing more specific (finance, store, pipeline, traffic) applies.

## Do not use when

- A specific domain dominates (finance, ecommerce, crm, analytics each own
  their lens).
- The screen is primarily a table (use tasks, users, or roles capsules).
- The screen is a personal workspace (use the productivity capsule).
- The screen is operational status (use the infrastructure capsule).
- Creation or editing is the core flow (use crud-feature or invoice).

## Information hierarchy

1. **Metric cards.** Four headline numbers with deltas and sparklines. The
   whole business in one row; scannable in five seconds.
2. **Performance overview.** Wide chart panel pairing two related series
   (the source pairs performance lines with subscriber context). Explains
   how the headline numbers moved.
3. **Subscriber overview plus recent customers.** Supporting breakdown
   beside or below the chart: segment detail plus a compact customer table
   with row links. Evidence behind the aggregates.

## Composition

`route.tsx` composes three widgets with no page header in the source:

```text
Page (@container/main flex flex-col gap-4 md:gap-6)
├── MetricCards
├── PerformanceOverview
└── SubscriberOverview (+ RecentCustomersTable)
```

- The `@container/main` query container lets cards respond to their
  container width, not just the viewport.
- No title row in the source; add one only when the product needs explicit
  page identity (most products do: title plus date or scope line).
- Widgets own cards, titles, and empty states; the route only stacks.
- Order is fixed: metrics, chart, breakdown. Never place the table above
  the chart; aggregates precede evidence.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `MetricCards` | `card`, `badge` | Value-first; delta helper plus sparkline |
| `PerformanceOverview` | `card`, `chart` (recharts), `select` | Multi-series chart with period control |
| `SubscriberOverview` | `card`, `chart`, `table` | Segment breakdown beside chart |
| `recent-customers-table` | TanStack Table, `table`, `badge`, `checkbox` | Compact rows; name, status, value, link |

- Semantic tokens only: `text-muted-foreground` helpers, default card
  chrome, CSS-variable chart colors.
- Deltas pair sign text with variant; never color alone.
- `data.json` is demo content; derived products replace it with server
  queries behind the same view-model shape.
- Table follows the data-table pattern at compact density.

## Required states

- Loading: skeleton metric row plus chart placeholder with fixed height;
  container queries must not thrash as data arrives.
- Empty metrics: zero states with labels, not blank cards.
- No chart data: textual summary replaces axes ("No activity in range").
- Empty customers: table zero state with a create or import action.
- Error: per-widget error with retry; chart failure never blanks metrics.
- Permission denied: masked values with explanation; visible counts stay.
- Overflow: long names truncate with ellipsis; full value on hover.
- Viewports: cards wrap 4-up to 2-up to 1-up via container queries; chart
  stacks above breakdown on narrow containers.
- Themes: chart gridlines, tooltips, and badge contrast verified in both
  modes.

## SSR notes

- `route.tsx` is SSR-safe: static composition over server-provided props.
- Metric cards render server values; sparklines hydrate interactivity in
  effects while the server shows static points or summary text.
- The performance chart is a client island: axes plus summary on the
  server, tooltips and hover after hydration.
- Period selection updates state through handlers and refetches; deep-link
  it in search params only when sharing a scoped view matters.
- Customer table renders the first rows on the server; sort and pagination
  hydrate client-side.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { MetricCards } from "./-components/metric-cards";
import { PerformanceOverview } from "./-components/performance-overview";
import { SubscriberOverview } from "./-components/subscriber-overview";

export const Route = createFileRoute("/(main)/dashboard/default")({
  component: Page,
});

function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <MetricCards />
      <PerformanceOverview />
      <SubscriberOverview />
    </div>
  );
}
```

## Allowed deviations

- Add a page header (title, scope line, one primary action) when the
  product needs identity; keep the three-widget order.
- Swap metric definitions for the product's headline numbers; keep four
  value-first cards.
- Replace the chart series with the product's core trend; keep the
  chart-plus-breakdown pairing.
- Swap the customer table for any compact evidence table (orders, alerts,
  signups) without changing position.
- Promote period or segment to the URL only when scoped views must be
  shared.
- Promote a widget to shared dashboard code only after a second concrete
  consumer exists.
