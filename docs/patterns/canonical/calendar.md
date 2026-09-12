# Calendar capsule

> Distilled from `src/routes/(main)/dashboard/calendar/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/calendar/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/calendar/-components/`
>   (`calendar.tsx`, `events-data.ts`)

## Use when

- The calendar itself is the product surface (scheduling, booking, planning).
- Users think in month, week, or day views rather than lists.
- Events need create, move, and inspect flows in one place.
- The screen owns the full content height, not a card in a grid.
- A toolbar with view switching plus today-navigation answers orientation.
- Secondary metadata (attendees, location) fits in a detail affordance.

## Do not use when

- A date picker inside a form is enough (use the form pattern with the
  calendar primitive, not this full screen).
- Events are secondary content beside KPIs (graft a compact agenda panel
  onto a dashboard capsule instead).
- The screen is analytics over time (use the analytics-dashboard capsule).
- The workflow is personal task triage (use tasks or productivity capsules).
- Read-only date display suffices; this capsule pays for interactivity.

## Information hierarchy

1. **Calendar toolbar.** View switcher (month, week, day), today button, and
   prev/next controls. Orientation first: users must always know which
   period they see and how to return to today.
2. **Event grid.** The month, week, or day surface built on the protected
   calendar primitives. Events render as compact blocks with title plus time.
3. **Event detail.** Selection opens detail (popover, dialog, or side panel)
   with full metadata and edit actions. The grid stays mounted underneath.
4. **Creation affordance.** Empty-slot or new-event action starts a form with
   the preselected slot. Creation never navigates away from the calendar.
5. **Overflow affordances.** "+N more" indicators and day-cell expansion keep
   dense days readable without shrinking every event to noise.

## Composition

`route.tsx` is a one-line shell; `Calendar` owns toolbar, grid, and detail:

```text
Page
└── Calendar
    ├── toolbar (view select + button-group + today + prev/next)
    ├── event grid (month | week | day)
    ├── "+N more" overflow affordances
    └── event detail (dialog or popover) + creation form
```

- The route passes no layout wrappers; the widget owns full height.
- `events-data.ts` holds typed demo events; derived products replace it with
  a server query behind the same item shape.
- Toolbar layout: view control left, period label center, navigation right
  on wide screens; wraps with `flex-wrap` on narrow screens.
- Detail opens as dialog on mobile and popover or side panel on desktop.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `Calendar` | `calendar` (protected), `button`, `button-group`, `select` | Full interactive surface; never reimplemented per feature |
| Toolbar | `button-group`, `select` | View switch plus navigation; labelled controls |
| Event blocks | `badge`-like chips | Title plus time; status via text, not color alone |
| Detail | `dialog` or `popover` | Full metadata, attendee list, edit and delete |
| Creation form | `field`, `input`, `select`, calendar primitive | Slot-preselected; validates before save |

- Protected primitives in `src/components/calendar/` are composed, never
  forked; feature code adds wrappers around them.
- Semantic tokens only; event colors use named palette entries with text
  labels so meaning survives without color.
- Today marker pairs outline or weight with the word "Today" nearby.
- Focus states stay visible on grid cells, event blocks, and toolbar
  controls for keyboard navigation.

## Required states

- Loading: skeleton grid with the toolbar mounted so view switching feels
  instant when events arrive.
- Empty period: grid renders with a quiet note ("No events this week")
  plus a create action; never a blank surface.
- No results: filtered views name the active filter and offer to clear it.
- Conflict: overlapping events stack or offset with accessible order, not
  hidden overlap.
- Error: failed event load shows inline error with retry; cached events stay
  visible when available.
- Permission denied: read-only viewers see events without create or edit
  affordances; the restriction is explained once.
- Overflow: dense days collapse behind "+N more" with keyboard-reachable
  expansion.
- Viewports: day view default on narrow screens; month grid keeps cell
  minimums without horizontal page scroll.
- Themes: event contrast checked in light and dark mode; selected states
  remain distinguishable.

## SSR notes

- `route.tsx` renders on the server; the calendar widget renders the current
  period from server-passed initial events.
- Interactivity (view switching, drag-to-move, popovers) hydrates in
  effects; the first paint shows a readable static grid.
- The visible period and view belong in URL search params when deep-linking
  a period matters; otherwise keep them local.
- Event mutations run through server functions with validation; optimistic
  updates reconcile against the server response.
- Never read `window` or layout measurements during render; measure inside
  effects behind guards.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "./-components/calendar";

export const Route = createFileRoute("/(main)/dashboard/calendar")({
  component: Page,
});

function Page() {
  return <Calendar />;
}
```

The widget itself follows this SSR-safe shape:

```tsx
// -components/calendar.tsx (shape, distilled)
import { useState } from "react";
import { CalendarDayView, CalendarMonthView, CalendarWeekView } from "@/components/calendar";

type CalendarView = "month" | "week" | "day";

export function Calendar() {
  const [view, setView] = useState<CalendarView>("month");
  // Effects hydrate selection, drag state, and live updates.
  // The server render shows the current period grid statically.

  return (
    <div className="flex h-full flex-col gap-4">
      {/* toolbar: view select + today + prev/next */}
      {/* grid: month | week | day view */}
      {/* detail dialog + creation form */}
    </div>
  );
}
```

## Allowed deviations

- Persist view and focused date in search params when periods must be
  shareable links.
- Replace the detail presentation (dialog, popover, side panel) to match
  the product's overlay conventions.
- Add resource lanes (rooms, people) when multi-resource scheduling is the
  actual requirement; keep single-lane default otherwise.
- Graft read-only agenda widgets onto other dashboards without importing
  this full screen.
- Extend the event shape with product fields; keep title, start, end, and
  status required.
- Promote nothing from `-components/` to shared code until a second
  consumer exists.
