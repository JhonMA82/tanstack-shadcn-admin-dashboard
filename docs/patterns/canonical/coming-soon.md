# Coming-soon capsule

> Distilled from `src/routes/(main)/dashboard/coming-soon/route.tsx`
> (boilerplate v0.2.1). Placeholder pattern for unreleased screens.

## Use when

- Reserving a route for a screen that is planned but not built yet.
- Navigation must show the entry before the feature lands.
- The placeholder must explain state and set expectations.

## Do not use when

- The screen exists in any usable form; ship it behind permissions instead.
- The route is permanently retired; remove it and redirect instead.
- A loading or error state is needed; those belong to real screens.

## Information hierarchy

1. Title stating the page is under development.
2. One sentence naming availability ("available in future updates").
3. Optional follow-up: contact, changelog link, or back navigation.

## Composition

Centered full-height stack: `flex h-full flex-col items-center
justify-center space-y-2 text-center`. No cards, no actions beyond an
optional back link.

## Widgets and tokens

No primitives required. Semantic text tokens only (`text-muted-foreground`
for the explanation). Keep `text-2xl font-semibold` title scale.

## Required states

Renders identically in light and dark mode, on narrow and wide viewports,
and for keyboard and screen-reader users (real heading, plain paragraph).

## SSR notes

Fully static and SSR-safe. No state, no effects, no browser APIs.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(main)/dashboard/coming-soon")({
  component: Page,
});

function Page() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
      <h1 className="font-semibold text-2xl">Page not found.</h1>
      <p className="text-muted-foreground">This page is under development.</p>
    </div>
  );
}
```

## Allowed deviations

- Add a back link or contact action when the product needs it.
- Localize copy; keep the centered static shape.
- Delete the route once the real screen ships.
