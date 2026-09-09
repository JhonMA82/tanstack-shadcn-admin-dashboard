# ADR-005: Deterministic scaffolding

- Status: Accepted
- Date: 2026-07-23

## Context

AI agents can produce inconsistent route trees, naming, state files, and component
boundaries when asked to create the same class of feature repeatedly.

## Decision

Create new feature, dashboard, CRUD, and derived-project structures through versioned
templates and repository scripts.

Generators:

- Validate names.
- Refuse overwrites by default.
- Render known file trees (`route.tsx` with `createFileRoute`, `-components/`,
  `-schemas/`, `-data/` where applicable).
- Optionally register navigation with a valid `AppPath` and Lucide icon component.
- Regenerate AI context.

## Consequences

- The AI implements business behavior instead of inventing scaffolding.
- Template changes are reviewable and versioned.
- Generated code is intentionally minimal and must still be adapted.
- Generator output becomes part of the repository contract.

## Alternatives rejected

- Prompt-only scaffolding.
- Copying arbitrary existing routes.
- External code generators with hidden or unversioned templates.
