# Project contract

Copy this file to `PROJECT.md` and complete it before implementing product features.

## Identity

- Product name: [Complete]
- One-sentence purpose: [Complete]
- Primary business outcome: [Complete]
- Boilerplate source version or commit: [Complete]

## Users and roles

| Role | Responsibilities | Restricted actions |
| --- | --- | --- |
| Administrator | [Complete] | [Complete] |
| Standard user | [Complete] | [Complete] |

## Business domains

- Domain: [Complete]
  - Purpose: [Complete]
  - Core entities: [Complete]
  - Important invariants: [Complete]

## Navigation

| Label | Route | Permission | Status |
|---|---|---|---|
| Dashboard | `/dashboard/default` | [Complete] | active |

## Integrations

| Integration | Protocol or library | Authentication | Source of truth |
|---|---|---|---|
| [Complete] | [Complete] | [Complete] | [Complete] |

## Data and state strategy

- Server data source: [Complete]
- Authentication and session: [Complete]
- Authorization model: [Complete]
- URL state: [Complete]
- Shared client state: [Complete]
- Cache and revalidation: [Complete]
- Error normalization: [Complete]

## Non-functional requirements

- Accessibility target: [Complete]
- Supported browsers: [Complete]
- Performance constraints: [Complete]
- Security constraints: [Complete]
- Localization: [Complete]
- Auditability: [Complete]
- Observability: [Complete]

## Product-specific UI rules

Do not repeat the general rules from `AGENTS.md`.

- Brand: [Complete]
- Density: [Complete]
- Terminology: [Complete]
- Required product states: [Complete]
- Responsive expectations: [Complete]

## Out of scope

- [Complete]

## Definition of done

Every product change must:

- Satisfy its explicit acceptance criteria.
- Respect `docs/architecture.md`.
- Use the appropriate generator for new route structure.
- Include applicable loading, empty, error, permission, responsive, and accessibility
  behavior.
- Pass `npm run validate`.
- Refresh `docs/ai/generated-context.md` when structural context changes.
