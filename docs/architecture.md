# Studio Admin architecture

## Technology baseline

- TanStack Start with TanStack Router file-based routing.
- React 19.
- SSR-first rendering (no React Server Components; no `"use client"` directives).
- TypeScript strict mode.
- Tailwind CSS v4.
- shadcn/ui local primitives using `base-nova`.
- React Hook Form and Zod for forms.
- TanStack Table for advanced tables.
- Zustand for genuinely shared client state.
- Biome for formatting, linting, and import organization.
- npm as the package manager and Bun as the script/tooling runtime: `npm install`
  manages application dependencies, while `npm run generate:*`, `ai:context`, and
  `validate:*` scripts invoke TypeScript tooling internally through Bun.

Installed framework documentation and local component source are authoritative.
Before framework or routing changes, consult the current official documentation:

- TanStack Start: <https://tanstack.com/start/latest/docs/framework/react/overview>
- TanStack Router: <https://tanstack.com/router/latest/docs/framework/react/overview>

## Repository map

```text
src/
├── routes/
│   ├── (external)/
│   ├── (main)/
│   │   └── dashboard/
│   │       ├── -components/
│   │       ├── (legacy)/
│   │       └── <feature>/
│   │           ├── -components/
│   │           ├── -schemas/
│   │           └── route.tsx
│   └── __root.tsx
├── components/
│   ├── ui/
│   └── calendar/
├── data/
├── hooks/
├── lib/
├── navigation/
│   └── sidebar/sidebar-items.ts
├── server/
├── stores/
└── styles/
    └── presets/
```

Root-level `scripts/` contains AI-friendly scaffolding and validation tooling. Existing
theme-generation scripts remain in `src/scripts/`.

Route groups such as `(main)`, `(external)`, and `(legacy)` are organizational and do
not add URL segments. Directories prefixed with `-` (for example `-components/`) are
excluded from route generation and hold co-located feature code. `$param.tsx` is a
dynamic segment and `$.tsx` is a splat route. `src/routeTree.gen.ts` is generated;
never edit it manually.

## Dependency direction

Allowed:

```text
route -> own private code
route -> shared dashboard components
route -> shared application components
route -> public server/domain API
route -> hooks and lib

feature interactive component -> own private modules
feature interactive component -> shared components/ui
feature interactive component -> shared hooks and lib

server/domain -> lib
shared component -> components/ui, hooks, lib
components/ui -> lib
```

Forbidden:

```text
server/domain -> route module
lib -> route module
shared primitive -> business feature
feature A -> feature B private code
new route -> legacy route internals
```

## Ownership rules

### Route modules

`route.tsx` owns:

- Route registration via `createFileRoute` (the file route id includes groups,
  for example `/(main)/dashboard/<feature>`).
- Loader data composition and search-parameter validation.
- Page-level composition of focused components.
- Pending and error states via `pendingComponent` and `errorComponent`.

It does not own large presentational trees or browser-only logic.

### Route-private code

Use the owning route's private directories:

```text
-components/
-schemas/
-data/
-lib/
```

Create only the directories the feature requires.

### Shared dashboard code

`src/routes/(main)/dashboard/-components/` is for dashboard-shell-specific components used by
multiple dashboard routes.

### Shared application code

`src/components/` is for stable application-wide components with at least two concrete
consumers.

### Protected primitives

`src/components/ui/` and `src/components/calendar/` are protected local primitives.
Feature code composes them without changing their internals.

A primitive change requires explicit impact analysis across every consumer.

## SSR-first rendering

Routes render on the server by default. There are no React Server Components in this
project, so `"use client"` directives must never appear.

- `route.tsx` stays SSR-safe: no direct browser API access at module scope or during
  render.
- Browser-only behavior lives in focused components and runs inside effects, guarded
  client code, `<ClientOnly>`, or TanStack environment functions such as
  `createClientOnlyFn`.
- Server-only behavior exposed to the application uses `createServerFn` and validates
  all client-controlled input.
- Pass serializable, minimal props into interactive islands. Prefer view models over
  raw transport responses.

## Data architecture

For derived products with real data:

- Validate input and external responses at trust boundaries.
- Enforce authorization on every server function and protected query.
- Keep secrets and transport clients out of browser-executed code.
- Normalize transport responses into typed domain or view models.
- Keep cache and revalidation decisions close to server queries.
- Normalize server errors into stable, UI-safe results.
- Do not duplicate server data into Zustand without an explicit requirement.

A domain server module should prefer:

```text
src/server/<domain>/
├── queries/
├── mutations/
├── schemas/
└── types.ts
```

Do not create a server layer solely to wrap static demo arrays.

## State ownership

Use this order:

1. Server/source-of-truth state.
2. URL state for shareable and navigable state.
3. Local component state for transient presentation.
4. Zustand only for shared client state without a better owner.

URL state includes page, sort, filters, search, and navigable tabs.

## Visual architecture

- Reuse the dashboard shell and layout controls.
- Use semantic CSS-variable tokens.
- Match nearby current screens for spacing, density, typography, borders, and radius.
- Use Tailwind named colors only when no semantic token exists and the product explicitly
  requires a non-theme color.
- Do not copy raw colors from screenshots.
- Do not use legacy screens as visual references for new work.

## Accessibility architecture

Every feature defines:

- Semantic structure and heading order.
- Keyboard interaction.
- Focus behavior and restoration.
- Accessible names and descriptions.
- Error association and announcements.
- Disabled and pending semantics.
- Responsive reading and tab order.

Accessibility is part of acceptance and verification.

## Deterministic development

New structures are created through templates in `templates/` and generators in `scripts/`.

Repository structure is indexed into `docs/ai/generated-context.md`.

Architecture and navigation validators convert core conventions into executable quality
gates.

## Change ownership

- Stable product facts: `PROJECT.md`.
- Architecture: this document and ADRs.
- Reusable implementation recipes: `docs/patterns/`.
- Canonical references: `docs/ai/canonical-examples.yaml`.
- Current repository inventory: `docs/ai/generated-context.md`.
- Product-change requirements: supplied by the later development workflow.
