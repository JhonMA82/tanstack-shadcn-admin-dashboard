# Academy dashboard capsule

> Distilled from `src/routes/(main)/dashboard/academy/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/academy/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/academy/-components/`
>   (`kpi-cards.tsx`, `class-schedule.tsx`, `assignment-status.tsx`,
>   `performance-highlights.tsx`, `upcoming-events.tsx`)

## Use when

- Building a teacher, instructor, or cohort overview screen.
- The primary user asks "how is my class doing today" at a glance.
- Content mixes schedule (time-ordered) with performance (aggregate) data.
- Secondary content is event reminders and announcements.
- The screen needs clear staff actions: announce, grade, create assignment.
- The audience is operational staff, not executives or analysts.

## Do not use when

- Building an executive KPI dashboard (use the default-dashboard capsule).
- Building trend analytics (use the analytics-dashboard capsule).
- The schedule is the whole product (use the calendar capsule).
- The screen is a per-person record (use the profile capsule).
- Data is financial or transactional (use finance or ecommerce capsules).
- The content is a file, task, or ticket collection (use those capsules).

## Information hierarchy

1. **Greeting header with staff actions.** Page title plus one contextual line
   ("Good morning, Teacher. Here's a quick overview of today's activity.")
   Actions sit right-aligned on desktop: New Announcement (primary), Gradebook
   and Add Assignment (outline). Actions answer "what do I do next".
2. **KPI strip.** Four summary cards (enrollment, attendance, average grade,
   pending submissions). Numbers first, delta or helper text second. Scannable
   in under five seconds.
3. **Today's schedule plus assignment status.** Schedule occupies the narrower
   column (`xl:col-span-5`); assignment status takes the wider column
   (`xl:col-span-7`). Time-ordered content first, aggregate table second.
4. **Performance highlights.** Wider lower panel (`xl:col-span-8`) with a
   small chart plus standout rows (top improvers, at-risk students).
5. **Upcoming events.** Narrow rail (`xl:col-span-4`) with dated event rows.
   Lowest priority: visible without scrolling on desktop, collapses below on
   mobile.

## Composition

`route.tsx` composes five focused widgets and owns no presentational logic:

```text
Page
├── header (title + contextual line + 3 action buttons)
├── KpiCards
├── grid xl:grid-cols-12
│   ├── ClassSchedule (xl:col-span-5)
│   └── AssignmentStatus (xl:col-span-7)
└── grid xl:grid-cols-12
    ├── PerformanceHighlights (xl:col-span-8)
    └── UpcomingEvents (xl:col-span-4)
```

- Container: `flex flex-col gap-4`.
- Header: `flex-col gap-4 lg:flex-row lg:items-end lg:justify-between`.
- Grids collapse to a single column below `xl`; order on mobile is KPIs,
  schedule, assignments, performance, events.
- Each widget owns its card, title row, and empty state; the route only
  stacks them.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `KpiCards` | `card`, icon | Four cards; large numeric value, small label, delta helper |
| `ClassSchedule` | `card`, `badge` | Time-ordered rows; badge marks live or next session |
| `AssignmentStatus` | `card`, `badge` | Status rows (submitted, pending, late); counts per state |
| `PerformanceHighlights` | `card`, `chart` (recharts), `avatar` | Small bar or line chart plus person rows |
| `UpcomingEvents` | `card` | Dated rows; title plus relative day label |

- Semantic tokens only: `text-muted-foreground` for secondary lines,
  default card border and radius, no raw colors.
- Status meaning travels in text plus badge variant, never color alone.
- Avatars carry accessible names; decorative icons are `aria-hidden`.
- Typography: `text-3xl tracking-tight` page title, `text-sm` secondary
  lines, card titles at default card-title size.

## Required states

- Loading: skeleton cards preserving the KPI strip and both grid rows so
  layout does not shift when data arrives.
- Empty schedule: card explains no classes today and points to the schedule
  source; no empty grid cells.
- No assignments: status panel shows a zero state, not a blank table.
- No performance data: chart area renders a textual summary ("No graded
  work yet") instead of empty axes.
- Error: per-widget error card with retry; one failing widget never blanks
  the whole screen.
- Permission denied: staff-only actions hide; the overview remains readable
  for permitted roles.
- Overflow: long class and student names truncate with ellipsis; full value
  available via title or tooltip.
- Viewports: single column below `xl`; header actions wrap with
  `flex-wrap` on narrow screens.
- Themes: all tokens semantic; chart colors come from CSS variables so
  light and dark mode both stay legible.

## SSR notes

- `route.tsx` is SSR-safe: static composition, no browser APIs at module
  scope or during render.
- KPI and schedule widgets render server-provided props; no fetch in render.
- The performance chart is a client island: it renders a static summary
  on the server and hydrates interactivity (tooltips, hover) in effects.
- Date display uses a server-passed value; never call `new Date()` during
  render for user-visible "today" labels without hydration guards.
- Announcement and assignment dialogs open from effects or event handlers,
  never during render.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AssignmentStatus } from "./-components/assignment-status";
import { ClassSchedule } from "./-components/class-schedule";
import { KpiCards } from "./-components/kpi-cards";
import { PerformanceHighlights } from "./-components/performance-highlights";
import { UpcomingEvents } from "./-components/upcoming-events";

export const Route = createFileRoute("/(main)/dashboard/academy")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl tracking-tight">Academy Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Good morning, Teacher. Here is today&apos;s overview.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:w-fit">
          <Button size="sm">New Announcement</Button>
          <Button size="sm" variant="outline">
            Gradebook
          </Button>
          <Button size="sm" variant="outline">
            Add Assignment
          </Button>
        </div>
      </div>
      <KpiCards />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <ClassSchedule />
        </div>
        <div className="xl:col-span-7">
          <AssignmentStatus />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <PerformanceHighlights />
        </div>
        <div className="xl:col-span-4">
          <UpcomingEvents />
        </div>
      </div>
    </div>
  );
}
```

## Allowed deviations

- Replace the three header actions with the product's staff actions; keep
  one primary plus outline secondaries.
- Swap KPI definitions for the product's cohort metrics; keep four cards
  and the value-first layout.
- Replace the schedule panel with any time-ordered list (sessions, shifts,
  lessons) without changing the 5/7 split.
- Replace performance highlights with any aggregate-plus-standouts panel.
- Add URL-persisted filters (week, group) only when the dataset genuinely
  needs them; default to the current period.
- Promote a widget to shared dashboard code only after a second concrete
  consumer exists.
