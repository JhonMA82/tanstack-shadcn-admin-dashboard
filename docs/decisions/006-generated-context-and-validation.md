# ADR-006: Generated AI context and executable validation

- Status: Accepted
- Date: 2026-07-23

## Context

Static architecture documentation cannot reliably describe every current route, component,
script, and navigation entry. Agents also cannot be trusted to remember all conventions
without executable checks.

## Decision

Generate `docs/ai/generated-context.md` from repository state and enforce freshness in the
validation command.

Convert high-confidence invariants into architecture and navigation validators.

Warnings identify lower-confidence smells without blocking the default gate.

## Consequences

- Agents receive compact, current repository context.
- Structural drift is visible in CI.
- Validators must avoid false-positive errors on the upstream baseline.
- Warning rules can be tightened incrementally.
- Generated context is never edited manually.

## Alternatives rejected

- Manually maintained repository inventories.
- Full repository scans for every task.
- Documentation-only architecture rules.
