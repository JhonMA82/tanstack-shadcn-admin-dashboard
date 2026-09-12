# Patient monitoring capsule

> Distilled from `src/routes/(main)/dashboard/patient-monitoring/`
> (boilerplate v0.2.1). Read this capsule instead of exploring the source.
> Load the source only when a listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/patient-monitoring/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/patient-monitoring/-components/`
>   (`patient-monitoring.tsx`, `patient-card.tsx`, `patient-detail.tsx`,
>   `patient-trends.tsx`, `vital-waveform.tsx`, `chart-grid.ts`,
>   `waveform-data.ts`, `realtime-utils.ts`, `use-patient-vital-series.ts`,
>   `use-realtime-tick.ts`, `data.ts`)

## Use when

- Building a realtime clinical or telemetry monitoring wall.
- The primary question is "who needs attention right now".
- Waveforms or vital series stream per subject with alarm semantics.
- A census strip (N patients) plus per-patient cards scales the wall.
- Selection opens deep detail (trends, history) without losing the wall.
- A fixed action footer (alarm review, silence, print) matches device UX.

## Do not use when

- Data is not realtime; static vitals belong on a profile-shaped record.
- Only one subject is monitored; a single-patient detail screen fits.
- No alarm semantics exist; generic dashboards mislead clinical users.
- The audience is administrative rather than bedside or ops.
- Safety review has not approved the alarm presentation; never improvise
  clinical alerting from this capsule alone.

## Information hierarchy

1. **Monitor header strip.** Unit name, live patient count, wall clock,
   alarm-audio and network tooltips. Identity, census, time, and lifeline
   state before any waveform.
2. **Patient wall.** `PatientMonitoring` grid of `PatientCard`s: name or
   bed, key vitals with units, waveform spark, status badge. Worst-first
   ordering so attention lands correctly.
3. **Selected detail.** `PatientDetail` with `PatientTrends` and full
   `VitalWaveform`: larger series, checkpoint history, thresholds. Evidence
   behind the badge.
4. **Waveform semantics.** Color plus label plus threshold line per vital;
   flatline or disconnect states render explicitly, never as gaps.
5. **Action footer.** Fixed buttons (main screen, setup, alarm review, wave
   review, trends, print, silence) plus device-status badge. Device parity
   for trained operators.

## Composition

`route.tsx` owns the full-bleed shell; widgets own wall, detail, footer:

```text
Page (min-h svh, data-content-padding="false")
├── header strip (unit + count + clock + alarm/network tooltips)
├── Separator
├── PatientMonitoring (patients)
│   ├── PatientCard grid (wall)
│   └── PatientDetail (selection: PatientTrends + VitalWaveform)
├── Separator
└── footer (action buttons + device badge)
```

- `data.ts` holds demo patients; `waveform-data.ts` holds series
  templates; `use-patient-vital-series.ts` repeats templates per patient
  while `use-realtime-tick.ts` plus `realtime-utils.ts` advance them.
- `chart-grid.ts` centralizes grid and threshold rendering so wall and
  detail share semantics.
- Selection is local state in the source; promote to search params only
  when linking to a patient matters.
- Footer buttons use fixed heights (`h-11`) with `flex-1` so glove or
  hurried taps land reliably.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `PatientMonitoring` | grid, `tabs` | Wall shell with census and selection |
| `PatientCard` | `card`, `badge` | Bed, vitals with units, spark, status |
| `PatientDetail` | `card`, `separator` | Full vitals plus history for selection |
| `PatientTrends` | `chart` (recharts) | Threshold lines with labelled axes |
| `VitalWaveform` | `chart`, `alert` | Streaming series with disconnect state |
| Footer | `button`, `badge`, `separator` | Fixed actions plus device status |
| Header tooltips | `tooltip` | Alarm audio and network state labels |

- Semantic tokens only on chrome; waveform colors pair with always-visible
  vital labels and units, never color alone.
- Alarm states add text ("TACHY", "LEAD OFF") plus shape, not hue shifts.
- Clock and timestamps derive from server-passed baselines to avoid
  hydration mismatch; ticking runs in effects.
- Every interactive control exposes a label; icon-only buttons carry
  `aria-label`s (alarm audio, network, print).

## Required states

- Loading: skeleton wall with census hidden until data arrives; footer
  mounts so actions feel present.
- Empty census: zero state with admit or connect action, not a blank wall.
- Disconnect: explicit lead-off or offline card state with last-known
  values and timestamp; never a frozen trace presented as live.
- Stale feed: values labelled with age ("12s ago") past the freshness
  budget, with re-arm action.
- Alarm: banner plus card escalation with silence semantics that match
  device policy; silencing never clears the underlying condition.
- Error: per-card error with retry; the wall never blanks for one feed.
- Permission denied: restricted patients mask values while census counts
  stay where policy allows.
- Overflow: long names truncate; vitals keep tabular numerals without
  wrapping.
- Viewports: wall columns collapse with worst-first order preserved;
  detail becomes full-screen on narrow displays.
- Themes: waveform contrast on dark clinical backgrounds verified first;
  light mode second.

## SSR notes

- `route.tsx` is SSR-safe; the first paint renders the census snapshot
  from server-provided props.
- Realtime ticks start in effects (`use-realtime-tick`) with cleanup;
  nothing streams during render.
- Waveform templates expand client-side from server snapshots; the server
  shows static series plus textual vitals.
- The wall clock ticks in an effect from a server-passed baseline to avoid
  hydration mismatch.
- Alarm audio and silence actions run in handlers with device confirmation
  semantics; never auto-play audio on load.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { patients } from "./-components/data";
import { PatientMonitoring } from "./-components/patient-monitoring";

export const Route = createFileRoute("/(main)/dashboard/patient-monitoring")({
  component: Page,
});

function Page() {
  return (
    <div
      className="flex min-h-[calc(100svh-var(--dashboard-header-height))] min-w-0 flex-col"
      data-content-padding="false"
    >
      {/* header strip: unit + census + clock + alarm/network tooltips */}
      <PatientMonitoring patients={patients} />
      {/* footer: fixed clinical actions + device badge */}
    </div>
  );
}
```

## Allowed deviations

- Replace vital sets with the product's telemetry (bedside, fleet, industrial);
  keep the snapshot-server plus stream-in-effects contract.
- Promote selection to search params when operators share patient links.
- Adjust footer actions to device parity requirements; keep silence and
  alarm-review semantics explicit.
- Add threshold configuration only beside real clinical governance.
- Never weaken disconnect or alarm states for visual calm; explicit states
  are the safety contract.
- Promote waveform primitives to shared code only after a second monitor
  consumes them.
