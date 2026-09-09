# Server function and mutation pattern

## Use when

A form or interaction mutates protected server-side state.

## Boundary

A server mutation must:

1. Authenticate.
2. Authorize the specific operation.
3. Validate untrusted input.
4. Normalize input.
5. Execute the domain mutation.
6. Normalize expected errors.
7. Revalidate affected data or redirect.
8. Return no secret or transport-specific details.

Implement mutations with `createServerFn`, validating all client-controlled input in the
validator before the handler runs.

## Result shape

Prefer a stable result that distinguishes:

- Success.
- Field validation errors.
- Form-level expected error.
- Unauthorized or forbidden.
- Conflict.
- Unexpected failure.

Do not expose stack traces, database errors, or internal service messages.

## Client behavior

Define:

- Pending state.
- Duplicate-submission defense.
- Optimistic behavior when justified.
- Success feedback.
- Focus for errors.
- Retry.
- Navigation or cache refresh.

## Verification

Test authorization independently from UI visibility. Test malformed input, conflicts,
expected service errors, and unexpected errors.
