# {{PROJECT_TITLE}}

## Identity

- Product name: {{PROJECT_TITLE}}
- One-sentence purpose: {{PROJECT_DESCRIPTION}}
- Primary business outcome: [Complete]
- Boilerplate source version: {{SOURCE_VERSION}}
- Boilerplate source commit: {{SOURCE_COMMIT}}

## Users and roles

| Role | Responsibilities | Restricted actions |
|---|---|---|
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

- Brand: [Complete]
- Density: [Complete]
- Terminology: [Complete]
- Required product states: [Complete]
- Responsive expectations: [Complete]

## Out of scope

- [Complete]

## Definition of done

Every product change must:

- Satisfy explicit acceptance criteria.
- Respect `docs/architecture.md`.
- Use deterministic generators for new route structure.
- Include applicable state, permission, responsive, and accessibility behavior.
- Pass `npm run validate`.
- Refresh generated AI context after structural changes.
