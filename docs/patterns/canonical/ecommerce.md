# Ecommerce dashboard capsule

> Distilled from `src/routes/(main)/dashboard/ecommerce/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/ecommerce/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/ecommerce/-components/`
>   (`kpi-strip.tsx`, `store-traffic.tsx`, `traffic-sources.tsx`,
>   `recent-orders.tsx`, `recent-orders-table/`, `top-products.tsx`,
>   `inventory.tsx`, `customer-reviews.tsx`)

## Use when

- Building a storefront overview: sales, traffic, orders, inventory.
- The primary question is "how is the store performing across channels".
- Users slice the whole screen by period and sales channel at once.
- Orders need a working table while products, inventory, and reviews ride
  alongside as supporting panels.
- The audience runs the store daily: merchandising plus fulfillment.

## Do not use when

- Data is personal finance rather than merchandise (use finance).
- Traffic analysis is the whole job (use the analytics-dashboard capsule).
- The screen is one order record (use a detail route with crud-feature).
- Inventory management is the whole product (a dedicated stock screen fits
  better than this overview).
- No channel or period slicing exists; the toolbar would be decoration.

## Information hierarchy

1. **Store header with scope controls.** "Store Overview" plus formatted
   date; period select (This Month, Last Month, Last 30 Days, Year to Date)
   and channel select (All Channels, Online Store, Marketplace, Social,
   Retail). Scope first: every widget below answers for the chosen slice.
2. **KPI strip.** Revenue, orders, conversion, average order value with
   deltas. The slice summarized in one row.
3. **Traffic pair.** `StoreTraffic` chart beside `TrafficSources`
   breakdown. Where demand comes from, then which sources convert.
4. **Recent orders.** Full-width working table with status badges and row
   actions. The operational core: fulfillment lives here.
5. **Merchandising row.** `TopProducts`, `Inventory`, and `CustomerReviews`
   as supporting panels. What sells, what runs low, what buyers say.

## Composition

`route.tsx` owns the header plus scope selects, then stacks five groups:

```text
Page
├── header (title + date + period select + channel select + settings)
├── KpiStrip
├── grid: StoreTraffic + TrafficSources
├── RecentOrders (+ recent-orders-table)
└── grid: TopProducts + Inventory + CustomerReviews
```

- Container: `flex flex-col gap-4`; header uses
  `flex-col gap-4 lg:flex-row lg:items-end lg:justify-between`.
- Selects carry `id` plus label associations (`ecommerce-period`,
  channel) for assistive technology.
- Scope state is local in the source; promote period and channel to search
  params when sliced views must be shareable.
- Grids collapse to one column below `lg`; orders table scrolls inside its
  card with a sticky header.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `KpiStrip` | `card` | Four value-first cards with deltas |
| `StoreTraffic` | `card`, `chart` (recharts) | Sessions and conversion series |
| `TrafficSources` | `card`, `chart` | Channel share rows with named colors |
| `RecentOrders` + table | TanStack Table, `table`, `badge`, `checkbox` | Status badges, totals, row actions |
| `TopProducts` | `card`, `avatar` or thumb | Ranked products with revenue share |
| `Inventory` | `card`, `badge`, `progress` | Stock rows; low-stock flagged in text |
| `CustomerReviews` | `card`, `avatar` | Review rows with rating plus snippet |

- Semantic tokens only; channel colors use named palette entries with text
  labels, never color alone.
- Stock status pairs badge text ("Low", "Out") with counts.
- Ratings expose text equivalents ("4.5 out of 5") beside stars.
- `Separator` divides header control groups; `ToggleGroup` or selects own
  scope switching.

## Required states

- Loading: skeleton KPI strip plus table skeleton; chart placeholders keep
  fixed heights during scope changes.
- Empty slice: every widget names the selected period and channel and offers
  to widen scope; no silent blank panels.
- No orders: table zero state with create or import action.
- Low or empty inventory: flagged rows explain restock action; never hide
  the panel.
- No reviews: quiet zero state, not a blank card.
- Error: per-widget error with retry; scope controls stay usable so users
  can pivot slices.
- Permission denied: revenue masking with explanation; operational panels
  stay readable where permitted.
- Overflow: long product and customer names truncate; full value on hover.
- Viewports: controls wrap with `flex-wrap`; merchandising panels stack on
  narrow screens.
- Themes: chart and badge contrast verified in both modes.

## SSR notes

- `route.tsx` is SSR-safe; the formatted date derives from a server-passed
  value to avoid hydration mismatch (never raw `new Date()` in render for
  user-visible dates without guards).
- Scope selects update state through handlers and refetch; the first paint
  renders defaults from the server.
- Charts are client islands: static summary on the server, tooltips and
  hover after hydration.
- The orders table renders its first page on the server; sort, filter, and
  pagination hydrate client-side.
- Review and inventory panels render server props with no fetch in render.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Select, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { CustomerReviews } from "./-components/customer-reviews";
import { Inventory } from "./-components/inventory";
import { KpiStrip } from "./-components/kpi-strip";
import { RecentOrders } from "./-components/recent-orders";
import { StoreTraffic } from "./-components/store-traffic";
import { TopProducts } from "./-components/top-products";
import { TrafficSources } from "./-components/traffic-sources";

export const Route = createFileRoute("/(main)/dashboard/ecommerce")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Store Overview</h1>
          {/* date + period/channel selects */}
        </div>
      </div>
      <KpiStrip />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <StoreTraffic />
        </div>
        <div className="xl:col-span-4 xl:col-start-9">
          <TrafficSources />
        </div>
      </div>
      <RecentOrders />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <TopProducts />
        </div>
        <div className="xl:col-span-4">
          <Inventory />
        </div>
        <div className="xl:col-span-4">
          <CustomerReviews />
        </div>
      </div>
    </div>
  );
}
```

## Allowed deviations

- Change period and channel options to the product's real dimensions; keep
  two labeled scope controls maximum in the header.
- Promote scope to URL search params when sliced views must be shared or
  bookmarked.
- Replace merchandising panels with the product's supporting trio; keep the
  orders table as the full-width anchor.
- Add fulfillment bulk actions to the orders table only for real multi-row
  workflows.
- Swap traffic widgets for the product's demand lens without moving the
  header-plus-strip-plus-orders skeleton.
- Promote a widget to shared code only after a second concrete consumer.
