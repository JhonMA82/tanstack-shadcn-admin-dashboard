# ADR-003: Evidence-based promotion to shared code

- Status: Accepted
- Date: 2026-07-23

## Context

Generic-looking components are often extracted before their contracts are understood.
This creates broad APIs, optional props, and coupling between unrelated features.

## Decision

A route-private component may move to a shared directory only when:

1. At least two concrete consumers exist.
2. Their behavior and API are materially the same.
3. The abstraction has a stable responsibility and name.
4. Promotion reduces duplication without creating cross-domain coupling.
5. All affected consumers are migrated in the same controlled change.

## Consequences

- Some intentional local duplication is acceptable.
- Shared APIs are based on observed behavior.
- Agents must cite consumers before proposing promotion.
- Shared-component usage may be reported by generated context and validators.

## Alternatives rejected

- Extract on first use.
- Create generic base components for hypothetical future features.
- Import another route's private component instead of promoting it properly.
