# ADR-002: SSR-first rendering

- Status: Accepted
- Date: 2026-07-23

## Context

TanStack Start routes render on the server by default, can enforce access before
rendering, and can avoid shipping unnecessary JavaScript. This project does not enable
React Server Components. Putting browser-only work directly in route modules weakens
these advantages and breaks server rendering.

## Decision

Keep `route.tsx` and route composition SSR-safe by default.

Create focused interactive components only for browser APIs, event handlers, client
hooks, or local interaction state. Browser APIs run inside effects, guarded client
code, `<ClientOnly>`, or `createClientOnlyFn`. Server-only behavior uses
`createServerFn` with input validation.

## Consequences

- Server-only resources stay out of browser bundles.
- Authorization and initial loading remain close to the route.
- Interactive islands require explicit serializable props.
- Agents must identify SSR/interaction boundaries during design.
- `route.tsx` containing a `"use client"` directive is an architecture error.
- `route.tsx` touching browser APIs outside effects or `createClientOnlyFn` is an
  architecture error.

## Alternatives rejected

- Browser-first route modules by default.
- Global client providers for feature-local interaction.
- Browser-only fetching for data available securely on the server.
- `"use client"` directives (unsupported without React Server Components).
