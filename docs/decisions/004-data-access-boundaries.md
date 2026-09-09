# ADR-004: Data access and trust boundaries

- Status: Accepted
- Date: 2026-07-23

## Context

Derived products may connect the visual boilerplate to APIs, databases, or server
functions. Without explicit boundaries, transport details and authorization logic can leak
into browser-executed code.

## Decision

Authentication, authorization, external-data validation, and mutation validation occur on
the server, exposed through `createServerFn` units with validated input.

Transport responses are normalized into typed domain or view models before reaching UI
components.

Shareable query state is represented in the URL and validated before use.

## Consequences

- Interactive components receive minimal serializable data.
- Every mutation has a server authorization boundary.
- External inputs are considered untrusted.
- Derived projects may introduce `src/server/<domain>/` when real integrations exist.
- Static demo data does not justify a server abstraction.

## Alternatives rejected

- Client-only protected data fetching.
- Trusting TypeScript types at runtime boundaries.
- Duplicating server data into global client stores by default.
