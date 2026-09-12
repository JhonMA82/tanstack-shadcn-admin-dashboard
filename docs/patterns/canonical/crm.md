# CRM dashboard capsule

> Distilled from `src/routes/(main)/dashboard/crm/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/crm/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/crm/-components/`
>   (`kpi-cards.tsx`, `pipeline-activity.tsx`, `task-reminders.tsx`,
>   `opportunities-section.tsx`, `opportunities-table/`)

## Use when

- Building a customer pipeline overview for sales or success teams.
- The primary question is "where does revenue stand and what needs action".
- Content mixes funnel aggregates with a working opportunity list.
- Task reminders and recent activity sit beside the numbers.
- The opportunity table needs sorting, selection, or bulk actions.
- The audience works the pipeline daily, not quarterly.

## Do not use when

- Building a neutral executive overview (use the default-dashboard capsule).
- Building marketing traffic analytics (use the analytics-dashboard capsule).
- The record is a single customer (use the profile capsule or a detail
  route with the crud-feature pattern).
- The table is the whole screen (use the tasks or users capsules).
- Data is financial ledger data (use the finance capsule).

## Information hierarchy

1. **KPI strip.** Pipeline value, win rate, open deals, and new leads with
   deltas. One row answering "are we up or down".
2. **Pipeline activity.** Chart panel showing stage movement or activity over
   time. Explains how the KPIs moved.
3. **Task reminders.** Time-ordered follow-ups (calls, emails, meetings).
   Answers "what do I do today".
4. **Opportunities section.** Full-width working table with stage badges,
   owners, values, and row actions. The operational core of the screen.

## Composition

`route.tsx` stacks four widgets with no header actions in the source:

```text
Page
├── KpiCards
├── PipelineActivity
├── TaskReminders
└── OpportunitiesSection
    └── opportunities-table (TanStack Table)
```

- Container: `flex flex-col gap-4 md:gap-6`.
- Order on every viewport is KPIs, activity, reminders, opportunities; the
  table anchors the bottom where it can grow.
- Each widget owns its card, title row, and empty state; the route only
  stacks them.
- Add a header row (title plus New Deal action) when the product needs
  explicit creation; keep the widget order unchanged.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `KpiCards` | `card`, `button` | Value-first cards with delta helpers |
| `PipelineActivity` | `card`, `chart` (recharts), `select` | Stage or activity series with period control |
| `TaskReminders` | `card`, `badge`, `checkbox` or `button` | Dated follow-ups with completion affordance |
| `OpportunitiesSection` | `card`, `input` | Section shell with search plus table |
| `opportunities-table` | TanStack Table, `table`, `badge`, `checkbox` | Stage badges, owner cells, value cells, row actions |

- Semantic tokens only; stage meaning travels in badge text plus variant,
  never color alone.
- Values use tabular numerals; owner cells pair avatar with name.
- Search input carries a visible label or `aria-label`.
- Table follows the data-table pattern: toolbar, density, pagination, and
  selection semantics.

## Required states

- Loading: skeleton KPI strip plus table skeleton with fixed rows so the
  layout does not shift.
- Empty pipeline: opportunities panel shows a zero state with a create
  action; KPIs show zeros, not blanks.
- No reminders: task panel states the calm ("Nothing due today") instead of
  collapsing.
- No results: filtered table names the active search or filter and offers
  to clear it.
- Error: per-widget error with retry; the table error never blanks KPIs.
- Permission denied: hidden values mask (e.g. deal amounts) while counts
  remain; restricted actions disappear with explanation.
- Overflow: long company and contact names truncate; full value on hover.
- Viewports: single column throughout; table scrolls horizontally inside
  its card with sticky header.
- Themes: chart and badge contrast verified in both modes.

## SSR notes

- `route.tsx` is SSR-safe: static composition over server-provided props.
- The opportunities table renders the first page on the server; sorting,
  filtering, and pagination hydrate as client islands.
- Table search and filter state belongs in URL search params when the view
  must be shareable; validate params with the route's search schema.
- Charts hydrate tooltips and hover in effects; the server render shows
  axes plus a textual summary.
- Reminder completion calls validated server functions; optimistic updates
  reconcile against the response.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { KpiCards } from "./-components/kpi-cards";
import { OpportunitiesSection } from "./-components/opportunities-section";
import { PipelineActivity } from "./-components/pipeline-activity";
import { TaskReminders } from "./-components/task-reminders";

export const Route = createFileRoute("/(main)/dashboard/crm")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <KpiCards />
      <PipelineActivity />
      <TaskReminders />
      <OpportunitiesSection />
    </div>
  );
}
```

## Allowed deviations

- Add a header with title plus New Deal or Import actions; keep the four
  widget order.
- Replace KPI definitions with the product's funnel metrics; keep the
  value-first strip.
- Swap the activity chart for a stage-funnel visualization when stage
  conversion is the real question.
- Promote table state (search, stage filter, page) to the URL when views
  must be shared between teammates.
- Add bulk actions to the table only when a real multi-row workflow exists.
- Promote the opportunities table to shared code only after a second
  concrete consumer exists.
