# CRUD feature pattern

## Use when

A domain entity needs list, create, view, edit, archive, delete, or status-change
capabilities.

CRUD is not automatically all operations. Scope each operation explicitly.

## Suggested structure

```text
src/routes/(main)/dashboard/<entities>/
├── -components/
│   ├── <entity>-columns.tsx
│   ├── <entity>-form.tsx
│   ├── <entity>-table.tsx
│   ├── <entities>-pending.tsx
│   └── <entities>-error.tsx
├── -data/
│   └── <entities>.ts
├── -schemas/
│   └── <entity>.ts
├── $id.tsx
├── new/
│   └── route.tsx
└── route.tsx
```

`route.tsx` is the list route (`createFileRoute("/(main)/dashboard/<entities>")`),
`new/route.tsx` is the creation route, and `$id.tsx` is the edit route for one entity.
Pending and error states are `pendingComponent`/`errorComponent` entries wired in each
route module.

The generated `-data/` module is a compile-ready placeholder. Replace it with the approved
server data boundary in real products.

## Functional contract

Specify:

- Entity identity and immutable fields.
- Operation permissions.
- Validation and normalization.
- Uniqueness and concurrency.
- Pagination, filtering, and sorting.
- URL persistence.
- Empty and no-result behavior.
- Destructive confirmation.
- Mutation feedback and retry.
- Audit requirements.

## Architecture

- List, create, and edit routes remain SSR-safe.
- Query parameters are validated before querying.
- Mutations validate and authorize on the server via `createServerFn`.
- Table interaction lives in focused components with browser APIs isolated in effects
  or guarded client code.
- Feature columns and actions remain route-private.
- Transport responses do not flow directly into UI components.

## Worked example

Create customer management (navigation is registered by default):

```bash
npm run generate:crud -- customers
```

> Keep the space after `--` so npm forwards the arguments; without it the
> generator prints usage and creates nothing.

Expected outcome (`customers` → singular `customer` inferred automatically):

```text
src/routes/(main)/dashboard/customers/
├── -components/
│   ├── customer-columns.tsx
│   ├── customer-form.tsx
│   ├── customer-table.tsx
│   ├── customers-pending.tsx
│   └── customers-error.tsx
├── -data/
│   └── customers.ts
├── -schemas/
│   └── customer.ts
├── $id.tsx
├── new/
│   └── route.tsx
└── route.tsx
```

- A `Customers` entry is added to the sidebar under the `Pages` group
  (`/dashboard/customers`, `Users` icon).
- `docs/ai/generated-context.md` is regenerated.
- `-data/customers.ts` is a compile-ready placeholder: replace it with the
  approved server data boundary; never ship the mock as product data.

## Scenarios

- **Irregular plural.** For `people`, the inferred singular may be wrong; pass
  `--singular person` to pin the entity name. A mismatch between the supplied
  route and the inferred plural prints a warning and preserves your route.
- **Scoped operations.** CRUD is not all-or-nothing: when creation is out of
  scope, delete `new/`; when editing is out of scope, delete `$id.tsx`.
  Keep the scaffold honest instead of shipping dead routes.
- **Hidden until ready.** `--no-nav` scaffolds the module without sidebar
  registration.
- **Placement and label.** `--nav-group Dashboards --nav-icon Building2`
  `--nav-title "Accounts"` adjusts sidebar registration without edits.
- **Name collision.** Existing files are preserved unless `--force` is passed.
- **Batch scaffolding.** Use `--no-context` across consecutive runs, then one
  `npm run ai:context` at the end.
- **Wrong generator.** A read-only overview without mutations is a dashboard
  (`generate:dashboard`); a tool without entity lifecycle is a feature
  (`generate:feature`).

## Verification

Include unauthorized operations, invalid input, duplicate/conflict behavior, empty data,
filter results, pagination boundaries, pending mutations, failure/retry, destructive
confirmation, and URL restoration.
