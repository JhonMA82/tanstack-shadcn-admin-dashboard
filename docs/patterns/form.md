# Form pattern

## Libraries

Use React Hook Form and Zod unless an approved feature pattern establishes a stronger
alternative.

## Schema ownership

- Keep feature-specific schemas with the feature (for example
  `src/routes/(main)/dashboard/<feature>/-schemas/`).
- Reuse a domain schema only when semantics are identical.
- Separate transport coercion from user-facing validation when necessary.
- Validate again at the server boundary.

## Required behavior

Define:

- Initial values.
- Dirty behavior.
- Pending submission.
- Field and form-level errors.
- Success feedback and navigation.
- Retry.
- Duplicate-submission protection.
- Unsaved-change behavior when required.
- Disabled fields and permissions.

## SSR and interaction boundary

The interactive form is a focused component with browser behavior isolated in effects or
guarded client code. The route module and initial data remain SSR-safe. No `"use client"`
directives are used.

The server mutation:

- Authenticates.
- Authorizes.
- Validates.
- Normalizes.
- Executes.
- Returns a stable UI-safe result.
- Revalidates or redirects as designed.

## Accessibility

- Every field has a label.
- Errors are associated with fields.
- Form-level errors receive focus or announcement.
- Required and disabled semantics are exposed.
- Keyboard submission and cancellation work.
- Destructive actions are clear.

## Verification

Test valid, invalid, server-error, unauthorized, pending, retry, and navigation behavior.
