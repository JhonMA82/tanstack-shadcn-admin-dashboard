# AGENTS.md

## Project overview

Studio Admin is a responsive admin dashboard built with TanStack Start, React 19, TypeScript, Tailwind CSS v4, and shadcn/ui.

This repository uses the shadcn `base-nova` style. When the shadcn CLI reports `base: "base"`, it refers to Base UI. Always inspect the local components in `src/components/ui/` because individual wrappers may use different primitives.

## TanStack Start and Router

Before making framework or routing changes, read the relevant current official documentation. Treat it as the source of truth for routing, SSR, server functions, environment boundaries, and deployment behavior.

- TanStack Start: <https://tanstack.com/start/latest/docs/framework/react/overview>
- TanStack Router: <https://tanstack.com/router/latest/docs/framework/react/overview>

- Routes are file-based under `src/routes/`.
- Route group directories such as `(main)`, `(external)`, and `(legacy)` are organizational and do not add URL segments or layouts.
- A directory `route.tsx` creates the route or layout for that directory; use `<Outlet />` for nested content.
- Files and directories prefixed with `-`, such as `-components`, are excluded from route generation and should hold co-located feature code.
- `$param.tsx` represents a dynamic segment and `$.tsx` represents a splat route.
- `src/routeTree.gen.ts` is generated. Never edit it manually.
- Routes use SSR by default. This project does not enable React Server Components, so do not add `"use client"` directives.
- Browser-only APIs must run in effects, guarded client code, `<ClientOnly>`, or TanStack environment functions such as `createClientOnlyFn`.
- Server-only behavior exposed to the application should use `createServerFn` and validate all client-controlled input.

## shadcn skill

Use the shadcn skill for all work involving shadcn/ui components, styling, composition, registries, presets, or `components.json`, when it is already available in your environment.

Never install external tooling to obtain it: opening this repository must not modify your global environment. When the skill is unavailable, work from local sources instead — `components.json`, this repository's docs, and inspection of the local component source under `src/components/ui/`.

The skill contains the component, styling, composition, accessibility, and CLI rules. Do not duplicate those rules here. Always inspect the local component source before using it.

Do not modify files inside `src/components/ui/` or `src/components/calendar/`. Keep these components intact and apply styling or customization where they are used.

## Setup

This project uses npm.

```bash
npm install
npm run dev
```

Available commands:

```bash
npm run build
npm run lint
npm run format
npm run check
npm run check:fix
npm run typecheck
npm run generate-routes
npm run generate:presets
npm run generate:project
npm run generate:feature
npm run generate:dashboard
npm run generate:crud
npm run ai:context
npm run ai:context:check
npm run validate:architecture
npm run validate:navigation
npm run phase1:self-test
npm run test:integration
npm run validate
```

The app has no unit/integration test suite of its own. Quality gates are mandatory before claiming any modification complete: `npm run validate` (`check`, `typecheck`, `validate:architecture`, `validate:navigation`, `ai:context:check`, `build`), plus `npm run phase1:self-test` for scaffolding changes. The heavy gate `npm run test:integration` performs real derived-project installs; run it when `scripts/` or project generation changes.

## Co-location-based structure

Keep feature code close to the route that owns it.

- Root route and document shell: `src/routes/__root.tsx`
- Dashboard layout: `src/routes/(main)/dashboard/route.tsx`
- Dashboard routes: `src/routes/(main)/dashboard/<screen>/route.tsx`
- Screen-specific components and data: `src/routes/(main)/dashboard/<screen>/-components/`
- Shared dashboard components: `src/routes/(main)/dashboard/-components/`
- Auth routes: `src/routes/(main)/auth/`
- Standalone application routes: `src/routes/(main)/chat/` and `src/routes/(main)/mail/`
- Shared application components: `src/components/`
- Local shadcn components: `src/components/ui/`
- Shared hooks and utilities: `src/hooks/` and `src/lib/`
- Server functions: `src/server/`
- Global stores: `src/stores/`
- Theme presets: `src/styles/presets/`

Keep a component inside its route until it is reused by another feature. Do not move screen-specific code into a shared directory preemptively.

## Creating or extending a screen

1. Inspect the closest current screen before writing code. Finance, Infrastructure, CRM, and Analytics are useful references. Do not use routes under `(legacy)` as references for new screens unless maintaining a legacy route.
2. When reproducing a UI from a screenshot or image, follow its visual direction closely, including layout, hierarchy, spacing, component structure, and important details. Implement it with the project's existing components and semantic theme tokens rather than copying raw color values. If the design needs a color that is not available through the existing theme tokens, or the user explicitly requests a non-theme color, use a named color from Tailwind's default palette. Do not use arbitrary hex, RGB, HSL, or OKLCH values.
3. Reuse the existing dashboard shell, local components, layout controls, and theme tokens.
4. Break each new page into focused components inside the route's `-components/` directory. Keep `route.tsx` small and focused on composing those pieces.
5. Keep interactive or browser-dependent behavior in focused components and make it safe for SSR. A `"use client"` directive does not disable SSR in this project.
6. Add the screen to `src/navigation/sidebar/sidebar-items.ts` when it should appear in the dashboard navigation.
7. Decide the information hierarchy before choosing widgets. Let the content determine the page structure.
8. Keep the established visual rhythm where it fits: compact spacing, clear typography hierarchy, responsive action rows, and grids that collapse cleanly on smaller screens.
9. Widget selection is not a fixed formula. Try different arrangements of cards, resource rows, meters, charts, tabs, empty states, and actions, then keep the version that communicates the content clearly and feels consistent with the project.
10. Match nearby screens in card density, borders, radius, spacing, content width, and responsive behavior.
11. Use semantic theme tokens so new screens work with light mode, dark mode, and the existing theme presets.
12. Handle relevant loading, empty, error, disabled, and overflow states.
13. Keep screens accessible with semantic HTML, keyboard support, visible focus states, labels, and appropriate ARIA attributes.

## Code conventions

- TypeScript strict mode is enabled. Use precise types and avoid `any`.
- Use the existing `@/` import aliases.
- Follow the Biome configuration: double quotes, semicolons, two-space indentation, sorted imports, and a 120-character line width.
- Avoid unnecessary dependencies.
- Keep changes focused and do not refactor unrelated files.
- Preserve user changes in a dirty worktree and do not commit unless explicitly requested.

## Contributions

- Use conventional commit prefixes such as `feat:`, `fix:`, `refactor:`, `docs:`, and `chore:`.
- Include screenshots for new screens and material visual changes. Include mobile and dark-theme states when relevant.
- Explain new reusable patterns or dependencies in the pull request.
- Follow `CONTRIBUTING.md` for the contribution workflow.

## Phase 1 contract (deterministic scaffolding)

This repository is a reusable TanStack Start dashboard boilerplate and a source for derived
products. Preserve its architecture, visual system, accessibility, and deterministic
development workflow. Detailed rules live under `docs/`. This section contains only
repository-wide instructions that must always be loaded alongside the TanStack sections above.

### Required context

Before planning or modifying product code, read:

1. `PROJECT.md`
2. `docs/architecture.md`
3. `docs/ai/project-map.yaml`
4. The applicable file under `docs/patterns/`
5. `docs/ai/canonical-examples.yaml`
6. The closest selected canonical example

Do not scan the entire repository without a concrete reason. Load the target feature,
direct dependencies, one applicable pattern, and no more than two canonical examples.

Before TanStack implementation, consult the current official documentation:

- TanStack Start: <https://tanstack.com/start/latest/docs/framework/react/overview>
- TanStack Router: <https://tanstack.com/router/latest/docs/framework/react/overview>

Before shadcn/ui work, inspect `components.json` and the relevant local source under
`src/components/ui/`.

### SSR-first invariants

- `route.tsx` remains SSR-safe by default: no `"use client"` directives anywhere.
- Browser APIs, event handlers, and local interaction state belong in focused components,
  running inside effects, guarded client code, `<ClientOnly>`, or `createClientOnlyFn`.
- Server-only behavior uses `createServerFn` and validates all client-controlled input.
- Route-private components, schemas, data, and helpers stay with the owning route under
  `-components/`, `-schemas/`, `-data/`, or `-lib/`.
- Shared components require at least two concrete consumers.
- Features do not import another feature's private internals.
- `src/components/ui/` and `src/components/calendar/` are protected primitives.
- New work does not use routes under `(legacy)` as references.
- Server and utility layers do not depend on route modules.
- Use existing `@/` aliases.
- Use semantic theme tokens and existing layout primitives.
- Do not add arbitrary hex, RGB, HSL, or OKLCH values to feature code.
- Enforce authentication, authorization, and input validation at server trust boundaries.
- Represent shareable filtering, sorting, pagination, and tab state in the URL.
- Avoid `any`; use precise TypeScript types.
- Sidebar entries use `url: AppPath` (route groups stripped, for example
  `/dashboard/reports`) and `icon: LucideIcon` component references, never strings.

### Scaffolding commands

Prefer repository generators over manually creating standard feature, dashboard, or CRUD structures. The machine-readable contract in `docs/ai/project-map.yaml` (`scaffolding:`) is authoritative for arguments and CLI flags — consult it before inventing route structures. Inspect the generated files and then implement business behavior. Only create those structures manually when the existing generator cannot represent the requested shape.

```bash
npm run generate:feature -- <name>              # navigation opt-in via --nav
npm run generate:feature -- <name> --nav

npm run generate:dashboard -- <name>            # navigation on by default, --no-nav disables

npm run generate:crud -- <plural-entity>        # navigation on by default, --no-nav disables
npm run generate:crud -- <plural-entity> --singular <singular-entity>
```

- `--nav` registers the feature in the sidebar navigation when appropriate.
- `--singular` explicitly sets the singular name of a CRUD entity.
- Route tree regeneration (`src/routeTree.gen.ts`) is automatic and mandatory — never edit that file manually.
- Tooling: **npm** is the package manager, **Bun** runs the generator/validator scripts (`generate:*`, `ai:context`, `validate:*`). Both are required.

Inspect generated files before implementation. Modify the scaffold to satisfy the approved
product behavior, not to introduce speculative abstractions. Generated routes use the
`route.tsx` form: `createFileRoute("/(main)/dashboard/<name>")` with `component`,
`pendingComponent`, and `errorComponent` composed from `-components/`.

### Canonical-example logging

Select examples from `docs/ai/canonical-examples.yaml`. Record:

- The selected example ID.
- Why it applies.
- Intentional deviations.

Existing code is a reference, not an exception to current architecture rules.

### Required states

Implement applicable:

- Loading.
- Empty.
- No filter results.
- Error and retry.
- Pending and disabled.
- Permission denied.
- Long-content and overflow.
- Small and large viewport.
- Keyboard and focus behavior.
- Light and dark themes.

### Validation

During implementation, run focused checks. Before completion, run the mandatory quality gates described in "Setup":

```bash
npm run validate
```

Add `npm run phase1:self-test` when scaffolding or templates changed, and the heavy gate `npm run test:integration` (real derived-project installs) when `scripts/` or project generation changed.

When repository structure changes, regenerate AI context:

```bash
npm run ai:context
```

A completion claim must include command evidence, skipped checks, and residual risks.

### Repository safety

Never:

- Push or rewrite Git history without explicit approval.
- Delete unrelated files.
- Read non-example environment files or expose secrets.
- Add a dependency without documenting why the existing stack is insufficient.
- Modify protected primitives for feature-specific requirements.
- Weaken validation to make an implementation pass.
