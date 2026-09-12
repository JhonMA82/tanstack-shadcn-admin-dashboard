# Analytics dashboard capsule

> Distilled from `src/routes/(main)/dashboard/analytics/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/analytics/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/analytics/-components/`
>   (`analytics-kpi-strip.tsx`, `analytics-toolbar.tsx`, `traffic-quality.tsx`,
>   `realtime-visitors.tsx`, `top-pages.tsx`, `top-traffic-sources.tsx`)
> - Extra stylesheet: `@/styles/flag-icons/flags.css` for country flag classes.

## Use when

- Building a traffic, engagement, or conversion analytics screen.
- The primary question is "where do visitors come from and what do they do".
- Content is chart-heavy with supporting ranked tables.
- Users switch perspectives (overview, audience, acquisition, engagement,
  conversions) without leaving the screen.
- A shared toolbar (date range, comparison) scopes every widget at once.
- Realtime or near-realtime visitor data sits beside slower aggregates.

## Do not use when

- Building a neutral executive overview (use the default-dashboard capsule).
- Building financial statements (use the finance capsule).
- Building a storefront overview with orders and inventory (use ecommerce).
- The screen is a single table with filters (use tasks or users capsules).
- Only one chart is needed; a tabbed shell adds needless complexity.
- Data has no time dimension to slice or compare.

## Information hierarchy

1. **Greeting header.** Short title plus one line stating the screen promise
   ("Monitor traffic, engagement, and conversion performance in one view").
   No actions here; scope controls live in the tab row.
2. **Perspective tabs plus toolbar.** `TabsList` with Overview, Audience,
   Acquisition, Engagement, Conversions; `AnalyticsToolbar` right-aligned
   (date range, compare toggle). Tabs answer "which lens", the toolbar
   answers "which period".
3. **KPI strip.** Session, bounce, conversion, and revenue deltas with
   sparklines. Comparable numbers first, charts as supporting evidence.
4. **Quality plus realtime.** `TrafficQuality` (`xl:col-span-7`) beside
   `RealtimeVisitors` (`xl:col-span-5`). Deep chart left, live counter
   right.
5. **Ranked breakdowns.** `TopPages` (`xl:col-span-7`) beside
   `TopTrafficSources` (`xl:col-span-5`). Tables carry flags, shares, and
   deltas so rows read without the charts.

## Composition

`route.tsx` owns the tab shell; each tab content panel stacks the same
KPI-plus-grids rhythm (the source implements the overview panel fully):

```text
Page
├── header (title + promise line)
└── Tabs (defaultValue="overview")
    ├── tab row: TabsList + AnalyticsToolbar
    └── TabsContent overview
        ├── AnalyticsKpiStrip
        ├── grid xl:grid-cols-12
        │   ├── TrafficQuality (xl:col-span-7)
        │   └── RealtimeVisitors (xl:col-span-5)
        └── grid xl:grid-cols-12
            ├── TopPages (xl:col-span-7)
            └── TopTrafficSources (xl:col-span-5)
```

- Container: `flex flex-col gap-4`; tab content panels repeat the pattern.
- Tab row: `flex flex-wrap items-center justify-between gap-3`.
- Grids use `items-stretch` so paired cards share height.
- Below `xl` every grid collapses to one column in reading order.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `AnalyticsKpiStrip` | `card`, `chart` | KPI cards with sparkline and delta text |
| `AnalyticsToolbar` | `select`, `button` | Period select plus compare control |
| `TrafficQuality` | `card`, `chart` (recharts) | Multi-series quality chart with legend |
| `RealtimeVisitors` | `card`, `chart` | Live counter plus short-window series |
| `TopPages` | `card`, `table` | Ranked page rows with views and delta |
| `TopTrafficSources` | `card`, flag icons | Source rows with country flags and share |

- Semantic tokens only; chart series use CSS-variable colors.
- Flag classes require the `flags.css` import wherever flags render.
- Deltas pair an arrow or sign with text; never color alone.
- `text-muted-foreground text-sm` for helper lines; tabular numerals for
  counts.

## Required states

- Loading: skeleton KPI strip plus chart placeholders with fixed heights so
  tabs do not jump when series arrive.
- Empty period: charts show a no-data message naming the selected range and
  offering to widen it; tables show zero rows with explanation.
- Partial data: realtime panel degrades to last-known values labelled
  "last updated"; aggregates stay authoritative.
- Error: per-widget error with retry; tab shell stays mounted so users can
  switch lenses.
- Permission denied: restricted lenses hide their tab triggers; the overview
  explains the restriction.
- Overflow: long page paths and source names truncate; full value on hover.
- Viewports: toolbar wraps below the tab list on narrow screens; grids stack.
- Themes: chart gridlines and tooltips derive from theme tokens; verify both
  modes before shipping a new series color.

## SSR notes

- `route.tsx` is SSR-safe: tabs render the default panel on the server with
  server-provided aggregates.
- Tab state is local presentation state (`defaultValue`), not URL state, in
  the source. Promote the active tab to search params only when deep-linking
  a lens is a real requirement.
- Charts are client islands: server renders axes plus textual summary, live
  updates and tooltips hydrate in effects.
- The realtime widget polls or subscribes inside an effect with cleanup; it
  never fetches during render.
- Toolbar selections update local or URL state through event handlers and
  trigger refetch; the flag stylesheet import is static and SSR-safe.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsKpiStrip } from "./-components/analytics-kpi-strip";
import { AnalyticsToolbar } from "./-components/analytics-toolbar";
import { RealtimeVisitors } from "./-components/realtime-visitors";
import { TopPages } from "./-components/top-pages";
import { TopTrafficSources } from "./-components/top-traffic-sources";
import { TrafficQuality } from "./-components/traffic-quality";
import "@/styles/flag-icons/flags.css";

export const Route = createFileRoute("/(main)/dashboard/analytics")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Monitor traffic, engagement, and conversion performance in one view.
        </p>
      </div>
      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
          </TabsList>
          <AnalyticsToolbar />
        </div>
        <TabsContent value="overview" className="flex flex-col gap-4">
          <AnalyticsKpiStrip />
          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TrafficQuality />
            </div>
            <div className="xl:col-span-5">
              <RealtimeVisitors />
            </div>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TopPages />
            </div>
            <div className="xl:col-span-5">
              <TopTrafficSources />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Allowed deviations

- Change lens names to match the product's analytics vocabulary; keep five
  or fewer tabs.
- Replace KPI definitions and ranked tables with the product's metrics; keep
  the strip-plus-paired-grids rhythm.
- Promote the active tab and period to URL search params when lenses must be
  shareable.
- Swap the realtime panel for any live aggregate; keep the 7/5 split and the
  degraded last-known state.
- Add a conversions panel per lens only when its chart answers a distinct
  question; do not duplicate the overview panel.
- Keep the flag stylesheet import co-located with the widget that renders
  flags.
