# Productivity dashboard capsule

> Distilled from `src/routes/(main)/dashboard/productivity/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/productivity/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/productivity/-components/`
>   (`summary-cards.tsx`, `tasks-section.tsx`, `projects-section.tsx`,
>   `quick-actions.tsx`, `quote-card.tsx`, `calendar-panel.tsx`,
>   `focus-card.tsx`, `recent-notes-card.tsx`, `weekly-summary-card.tsx`)

## Use when

- Building a personal home or daily-planning workspace.
- The primary question is "what should I focus on today".
- Content mixes tasks, projects, calendar, notes, and wellbeing in one
  warm screen.
- A narrow ritual rail (calendar, focus timer, notes, week review) rides
  beside a wide work column.
- The tone is encouraging, not executive or analytical.
- Quick capture (add task, note, event) must sit one click away.

## Do not use when

- Building a team or executive overview (use default-dashboard).
- Tasks are the whole product with filtering needs (use tasks capsule).
- The calendar owns the screen (use the calendar capsule).
- Projects need boards or tables (use kanban or tasks capsules and link
  them from here).
- The audience is operational staff running a queue (use crm or logistics).

## Information hierarchy

1. **Greeting.** Personal title plus encouragement line ("Good morning,
   Arham. Let's make today productive and meaningful."). Tone-setter, not
   data.
2. **Summary cards.** Day counts: tasks due, meetings, focus time, streak.
   The day quantified in one row.
3. **Tasks section.** Today's actionable list with completion affordance.
   The core: what to do next.
4. **Projects section.** Active efforts with progress; links out to full
   project surfaces. Context behind the tasks.
5. **Quick actions plus quote.** Capture row (new task, note, event, upload)
   then a motivational card. Momentum plus warmth.
6. **Ritual rail.** `CalendarPanel`, `FocusCard`, `RecentNotesCard`,
   `WeeklySummaryCard` stacked in a `lg:col-span-3` rail. Day shape, focus
   tool, memory, and reflection in fixed order.

## Composition

`route.tsx` splits a wide work column plus a narrow rail:

```text
Page (grid gap-6 lg:grid-cols-12)
├── work column (lg:col-span-9)
│   ├── greeting (title + line)
│   ├── SummaryCards
│   ├── TasksSection
│   ├── ProjectsSection
│   ├── QuickActions
│   └── QuoteCard
└── rail (lg:col-span-3)
    ├── CalendarPanel
    ├── FocusCard
    ├── RecentNotesCard
    └── WeeklySummaryCard
```

- Gaps are `gap-6` (roomier than operational dashboards) for a calm read.
- Rail stacks below the work column on narrow screens in fixed order:
  calendar, focus, notes, week.
- Each widget owns its card and empty state; the route only composes.
- Task completion and timer controls live inside their widgets with local
  state; persistence goes through server functions.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `SummaryCards` | `card`, `badge` | Day counts with friendly labels |
| `TasksSection` | `card`, `checkbox`, `button` | Today list with completion + add |
| `ProjectsSection` | `card`, `progress`, `button` | Efforts with progress bars and links |
| `QuickActions` | `card`, `button` | Capture launchers in a wrap row |
| `QuoteCard` | `card` | Static encouragement; low priority |
| `CalendarPanel` | `card`, calendar primitive | Mini month with today marked |
| `FocusCard` | `card`, `button`, `select` | Timer with duration select and controls |
| `RecentNotesCard` | `card`, `button` | Latest notes with capture link |
| `WeeklySummaryCard` | `card`, `progress` | Week stats with textual summary |

- Semantic tokens only; progress pairs bars with percentage text.
- Timer display uses tabular numerals; controls expose labels (start,
  pause, reset).
- Checkbox rows keep task names as real labels for screen readers.
- The quote card carries no actions; decorative quotes hide from noise.

## Required states

- Loading: skeleton summary row plus task placeholders; rail mounts with
  placeholders so the greeting never sits over blank space.
- Empty day: tasks section celebrates ("All clear") with a capture action.
- No projects: quiet zero state with a create link.
- No notes: capture-first zero state, not a blank card.
- Timer: idle, running, paused, and complete states each announce; completion
  never auto-plays audio.
- Error: per-widget error with retry; greeting and quote never fail.
- Permission denied: personal data hides per policy; capture actions
  disable with explanation.
- Overflow: long task and note titles truncate; full value on hover.
- Viewports: rail stacks under work below `lg`; quick actions wrap.
- Themes: warm tone verified in both modes; timer contrast checked.

## SSR notes

- `route.tsx` is SSR-safe; greeting and summary render from server-passed
  user and day props.
- Timer and completion state live client-side; the server render shows the
  idle snapshot without starting anything.
- Intervals bind in effects with cleanup; nothing ticks during render.
- Capture dialogs open from handlers; drafts persist locally per widget.
- Greeting time-of-day derives from a server-passed value to avoid
  hydration mismatch.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { CalendarPanel } from "./-components/calendar-panel";
import { FocusCard } from "./-components/focus-card";
import { ProjectsSection } from "./-components/projects-section";
import { QuickActions } from "./-components/quick-actions";
import { QuoteCard } from "./-components/quote-card";
import { RecentNotesCard } from "./-components/recent-notes-card";
import { SummaryCards } from "./-components/summary-cards";
import { TasksSection } from "./-components/tasks-section";
import { WeeklySummaryCard } from "./-components/weekly-summary-card";

export const Route = createFileRoute("/(main)/dashboard/productivity")({
  component: Page,
});

function Page() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section className="lg:col-span-9">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl text-foreground leading-none tracking-tight">
              Good morning, Arham.
            </h1>
            <p className="text-lg text-muted-foreground leading-none">
              Let&apos;s make today productive and meaningful.
            </p>
          </div>
          <SummaryCards />
          <TasksSection />
          <ProjectsSection />
          <QuickActions />
          <QuoteCard />
        </div>
      </section>
      <section className="flex flex-col gap-6 lg:col-span-3">
        <CalendarPanel />
        <FocusCard />
        <RecentNotesCard />
        <WeeklySummaryCard />
      </section>
    </div>
  );
}
```

## Allowed deviations

- Replace greeting and quote tone with the product's voice; keep the
  work-plus-rail skeleton.
- Swap rail widgets for the product's rituals (habits, journal, review);
  keep four stacked maximum.
- Link tasks and projects to their full surfaces instead of rebuilding
  filtering here.
- Persist timer preferences (duration) locally; sync history through
  server functions.
- Add weekly-reflection actions only beside real review capability.
- Promote a widget to shared code only after a second consumer exists.
