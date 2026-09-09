# Data table pattern

## Use when

Users need to compare rows across stable columns or use sorting, filtering, pagination,
selection, or row actions.

Do not use a table for content whose responsive representation is primarily card-based.

## Ownership

Keep feature columns, filters, and row actions route-private.

Promote a table abstraction only when multiple concrete consumers share the same
pagination, filtering, selection, and rendering contract.

## State

Use URL state for:

- Page.
- Page size when user-controlled.
- Sort.
- Search.
- Persistent filters.

Use local state for temporary menus or uncommitted inputs.

## Server and interaction boundary

- Server functions validate query parameters and fetch rows.
- Focused interactive components handle table interaction when required.
- Pass serializable rows and pagination metadata.
- Do not fetch protected data only from the browser when the server can enforce access.

## Required states

- Initial loading.
- Empty dataset.
- No filter results.
- Error and retry.
- Disabled actions.
- Long cell content.
- Small viewport.
- Partial row-action permission.

## Accessibility

- Use semantic table markup for tabular relationships.
- Name controls.
- Support keyboard sorting and actions.
- Communicate sort direction.
- Do not rely only on color for status.
