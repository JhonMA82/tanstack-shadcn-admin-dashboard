# Logistics capsule

> Distilled from `src/routes/(main)/dashboard/logistics/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/logistics/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/logistics/-components/`
>   (`logistics.tsx`, `shipment-list.tsx`, `shipment-details.tsx`,
>   `shipment-route-map.tsx`, `shipment-data.ts`)
> - Extra stylesheet: `@/styles/flag-icons/flags.css` for country flag classes.

## Use when

- Building a shipment, fleet, or delivery tracking screen.
- The primary question is "where is it and when does it arrive".
- A selectable list drives a detail panel plus a route visualization.
- Status lenses (all, in transit, delayed, delivered) slice the list.
- Urgent exceptions (customs hold, delay) must surface above the stream.
- Operators work list-to-detail all day without leaving the screen.

## Do not use when

- Tracking is one panel inside a store overview (graft a compact status
  list onto ecommerce instead).
- The map is decorative; if geography answers nothing, drop it and use a
  list-detail screen.
- Records are static without movement (a table capsule fits better).
- The workflow is warehouse inventory, not movement (design a stock
  surface instead).
- Only one shipment exists; a detail page replaces list-detail machinery.

## Information hierarchy

1. **Scope tabs plus search.** Lens tabs (all, active, delayed, delivered)
   with a search input. Slicing first: operators start from exceptions.
2. **Shipment list.** `ShipmentList` rows: id, origin to destination,
   status badge, ETA. Selection drives detail; the active row stays marked.
3. **Shipment details.** `ShipmentDetails`: timeline of checkpoints,
   carrier, contents summary, documents, and contact actions. Evidence for
   the status claim.
4. **Route map.** `ShipmentRouteMap`: origin-to-destination path with
   current position. Answers "where" in one glance; the timeline answers
   "when".
5. **Exception alerts.** `alert` banners for holds and delays above the
   affected detail, with the next action named. Never silent badges alone.

## Composition

`route.tsx` renders one shell; `Logistics` owns tabs, list, detail, map:

```text
Page
└── Logistics
    ├── scope row (tabs + search input-group)
    ├── alert slot (exception banners)
    └── content split
        ├── ShipmentList (selectable rows)
        ├── ShipmentDetails (timeline + meta + actions)
        └── ShipmentRouteMap (path + position)
```

- Desktop shows list beside detail with the map inside or beside detail;
  mobile shows list first, detail as a `sheet` or pushed view.
- `shipment-data.ts` holds typed demo shipments; derived products replace
  it with tracking queries behind the same shape.
- Selection state belongs in search params when shipments must be
  deep-linkable (they usually must: support links to shipments).
- Timeline checkpoints render oldest-to-newest with the current stage
  marked in text, not color alone.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| Scope tabs | `tabs`, `input-group` | Status lenses plus search query |
| `ShipmentList` | `card` or list rows, `badge` | Id, lane, status, ETA per row |
| `ShipmentDetails` | `card`, `separator`, `button` | Timeline, carrier, contents, actions |
| `ShipmentRouteMap` | map surface, `badge` | Path plus position marker with labels |
| Exception alert | `alert` | Hold or delay with named next action |
| Detail sheet | `sheet` | Mobile detail presentation |

- Semantic tokens only; status meaning travels in badge text plus variant.
- Flags and region codes pair icon with text wherever lanes render.
- ETAs use absolute dates with relative helpers ("Thu 14:00, in 2 days").
- The map always ships a text equivalent: lane, position, and ETA as real
  content, never pixels alone.

## Required states

- Loading: skeleton list plus detail placeholder; scope tabs stay mounted.
- Empty lens: zero state naming the lens ("No delayed shipments") with a
  clear-lens action.
- No selection: detail panel invites selection; never a blank column.
- No results: search-scoped message with a clear action.
- Stale tracking: position labelled with its timestamp ("as of 09:41")
  with refresh.
- Error: per-pane error with retry; list failure never blanks a loaded
  detail and vice versa.
- Permission denied: restricted lanes mask contents while showing status
  where appropriate.
- Overflow: long ids and port names truncate; full value on hover.
- Viewports: list-to-sheet flow on mobile; three-pane on desktop.
- Themes: map tiles or fallback, badges, and alerts verified in both modes.

## SSR notes

- `route.tsx` is SSR-safe; the shell renders the default lens from
  server-provided props.
- Selection and lens state live in URL search params with route validation
  so support links open the right shipment.
- The map is a client island: static lane summary on the server, live tiles
  and markers after hydration behind guards.
- Live position updates subscribe in effects with cleanup; the server
  render shows the last-known snapshot with its timestamp.
- Search filters through handlers; detail actions (contact, documents) call
  validated server functions.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Logistics } from "./-components/logistics";
import "@/styles/flag-icons/flags.css";

export const Route = createFileRoute("/(main)/dashboard/logistics")({
  component: Page,
});

function Page() {
  return <Logistics />;
}
```

Shell shape (distilled):

```tsx
// -components/logistics.tsx (shape, distilled)
export function Logistics() {
  // Lens + selected shipment derive from search params (validated).
  // Live positions subscribe in effects; server paints the snapshot.
  return (
    <div className="flex h-full flex-col gap-4">
      {/* scope row: tabs + search */}
      {/* alert slot for exceptions */}
      {/* list + details + route map */}
    </div>
  );
}
```

## Allowed deviations

- Replace shipment fields with the product's movement model; keep the id,
  lane, status, ETA, timeline contract.
- Swap the map provider without moving ownership: snapshot on server,
  live layer in effects, text equivalent always.
- Add document and customs actions only beside real capability.
- Persist lens, query, and selection in search params; validate every one.
- Collapse the map on narrow screens behind an explicit toggle; never drop
  the text equivalent.
- Promote list-detail primitives to shared code only after a second
  tracker consumes them.
