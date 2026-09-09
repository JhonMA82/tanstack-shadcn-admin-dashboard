# Architecture Decision Records

ADRs document durable decisions that affect multiple features or derived projects.

## Status values

- Proposed
- Accepted
- Superseded
- Deprecated

## Rules

Create or update an ADR when a change:

- Alters dependency direction.
- Introduces a shared abstraction or platform dependency.
- Changes SSR/interaction policy.
- Changes data access or trust boundaries.
- Changes generator or validation behavior.
- Changes how derived projects are created.

Do not create an ADR for ordinary feature implementation details.

## Index

- [ADR-001: Route colocation](001-route-colocation.md)
- [ADR-002: SSR-first rendering](002-ssr-first-rendering.md)
- [ADR-003: Evidence-based promotion to shared code](003-shared-component-promotion.md)
- [ADR-004: Data access and trust boundaries](004-data-access-boundaries.md)
- [ADR-005: Deterministic scaffolding](005-deterministic-scaffolding.md)
- [ADR-006: Generated AI context and executable validation](006-generated-context-and-validation.md)
