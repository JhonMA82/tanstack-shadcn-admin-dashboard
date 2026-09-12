# Phase 1 manifest

This manifest lists every file owned by the Phase 1 scaffolding port for the TanStack
Start boilerplate. All generator templates use the `route.tsx` form with `createFileRoute`
(`component`, `pendingComponent`, `errorComponent`) and dash-prefixed `-components/`.

## Root contracts

- `AGENTS.md`
- `PROJECT.template.md`
- `PROJECT.md`
- `MANIFEST.md`
- `INSTALL.es.md`
- `package.json` (Phase 1 scripts merged in; no separate overlay file)
- `tsconfig.scripts.json` (includes `scripts/**/*.ts`)

## Architecture documentation

- `docs/architecture.md`
- `docs/glossary.md`
- `docs/decisions/README.md`
- `docs/decisions/001-route-colocation.md`
- `docs/decisions/002-ssr-first-rendering.md`
- `docs/decisions/003-shared-component-promotion.md`
- `docs/decisions/004-data-access-boundaries.md`
- `docs/decisions/005-deterministic-scaffolding.md`
- `docs/decisions/006-generated-context-and-validation.md`

## Patterns

- `docs/patterns/feature.md`
- `docs/patterns/dashboard-screen.md`
- `docs/patterns/crud-feature.md`
- `docs/patterns/data-table.md`
- `docs/patterns/form.md`
- `docs/patterns/server-function.md`

## AI context

- `docs/ai/project-map.yaml`
- `docs/ai/canonical-examples.yaml`
- `docs/ai/generated-context.md`

## Generators and validators

- `scripts/create-project.ts`
- `scripts/create-feature.ts`
- `scripts/create-dashboard.ts`
- `scripts/create-crud.ts`
- `scripts/generate-ai-context.ts`
- `scripts/validate-architecture.ts`
- `scripts/validate-navigation.ts`
- `scripts/self-test.ts`
- `scripts/integration-test.ts`
- `scripts/_lib/**`

## Templates

- `templates/project/**`
- `templates/feature/**`
- `templates/dashboard/**`
- `templates/crud/**`
