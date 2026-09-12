# Infrastructure dashboard capsule

> Distilled from `src/routes/(main)/dashboard/infrastructure/`
> (boilerplate v0.2.1). Read this capsule instead of exploring the source.
> Load the source only when a listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/infrastructure/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/infrastructure/-components/`
>   (`infrastructure-data.ts`, `infrastructure-header.tsx`,
>   `project-environments.tsx`)
> - Extra stylesheet: `@/styles/flag-icons/flags.css` for region flag classes.

## Use when

- Building an operational status screen: projects, environments, regions.
- The primary question is "what is deployed where, and is it healthy".
- Content groups naturally by project, each holding environment rows.
- Region identity (flags, codes) helps operators scan across datacenters.
- Expand and collapse per group beats one endless status table.
- The audience is engineering or platform operations.

## Do not use when

- Building a business KPI overview (use the default-dashboard capsule).
- Metrics need charts and trends (graft analytics widgets instead).
- The unit is a deploy pipeline run (design a pipeline screen; this capsule
  shows standing state, not run history).
- Only one service exists; grouped sections would be empty ceremony.
- The audience is non-technical; status needs translation first.

## Information hierarchy

1. **Operations header.** Title plus scope line, search input for filtering
   projects, and region or status scoping controls. Narrows the fleet in
   place before any status renders.
2. **Project groups.** One `ProjectEnvironments` section per project from
   `infrastructureGroups`: project name, overall status badge, then
   environment rows (production, staging, preview). Fleet order matches
   operational priority.
3. **Environment rows.** Per row: environment name, region flag plus code,
   deployment version or commit, health badge, and a link or action to the
   environment. Everything needed to decide "do I need to look closer".
4. **Collapsed detail.** Per-group expansion reveals secondary metadata
   (urls, resources, last deploy). Detail stays one click away, never in
   the default scan path.

## Composition

`route.tsx` renders the header plus one section per group:

```text
Page
├── InfrastructureHeader (title + search + scope controls)
└── stack
    └── ProjectEnvironments per group
        ├── group row (name + overall badge + expand)
        └── environment rows (name + region + version + health + link)
```

- Container: `flex flex-col gap-4`; groups stack full width.
- `infrastructure-data.ts` holds typed demo groups; derived products
  replace it with a status query behind the same group shape.
- Collapsible behavior uses the `collapsible` primitive with labelled
  triggers; keyboard users expand every group.
- Flag classes require the `flags.css` import wherever regions render.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `InfrastructureHeader` | `input-group`, `button`, `kbd` | Search with keyboard shortcut hint |
| `ProjectEnvironments` | `collapsible`, `table`, `badge` | Group shell with environment rows |
| Environment row | flag icon, `badge`, link | Region, version, health, inspect link |
| Status badges | `badge` | Healthy, degraded, down, unknown as text |
| Brand icons | `simple-icon` | Provider or stack marks beside names |

- Semantic tokens only; health meaning travels in badge text plus variant,
  never color alone.
- Region shows flag plus code text ("EU", "US-E") so meaning survives
  without the icon font.
- Versions render short hashes or tags with full value on hover.
- `kbd` documents the search shortcut; the shortcut itself binds in an
  effect with cleanup.

## Required states

- Loading: skeleton header plus one skeleton section per expected group;
  search stays mounted.
- Empty fleet: zero state with deploy or connect action, not blank page.
- No results: filtered view names the query with a clear action.
- Unknown health: explicit "Unknown" badge with last-check time, never a
  missing badge that reads as healthy.
- Degraded or down: group surfaces the worst child status; detail names
  affected environments first.
- Error: per-group error with retry; healthy groups stay visible.
- Permission denied: restricted environments mask metadata while showing
  existence where appropriate; actions hide with explanation.
- Overflow: long project and url strings truncate; full value on hover.
- Viewports: rows wrap metadata below the name on narrow screens; flags
  and badges never clip.
- Themes: health badge contrast verified in both modes.

## SSR notes

- `route.tsx` is SSR-safe; groups render from server-provided status props.
- Search and scope state filter client-side over the loaded fleet; promote
  to search params only when fleet views must be shareable.
- Live health polling starts in an effect with cleanup and backoff; the
  server render shows snapshot values labelled with their check time.
- Collapsible expansion is local presentation state; deep-link a group with
  an anchor or param only when incidents must link to it.
- Keyboard shortcut binding lives in an effect and never fires during
  render or while typing in inputs.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { infrastructureGroups } from "./-components/infrastructure-data";
import { InfrastructureHeader } from "./-components/infrastructure-header";
import { ProjectEnvironments } from "./-components/project-environments";
import "@/styles/flag-icons/flags.css";

export const Route = createFileRoute("/(main)/dashboard/infrastructure")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-4">
      <InfrastructureHeader />
      <div className="flex flex-col gap-4">
        {infrastructureGroups.map((group) => (
          <ProjectEnvironments key={group.name} group={group} />
        ))}
      </div>
    </div>
  );
}
```

## Allowed deviations

- Replace group and row fields with the product's fleet model; keep the
  name, region, version, health, inspect-link row contract.
- Add per-environment actions (redeploy, rollback) only beside real
  capability with confirmation.
- Promote fleet search to the URL when operators share filtered views.
- Add incident banners above affected groups; keep the worst-status-first
  ordering.
- Swap flag icons for region codes alone when the icon font is unavailable.
- Promote the section shell to shared code only after a second concrete
  consumer.
