# Instalación de la fase 1

Esta entrega prepara el boilerplate TanStack Start para desarrollo asistido por IA. No instala todavía
OpenCode, OpenSpec, Superpowers ni Comet.

## 1. Contenido del overlay

Esta fase ya está aplicada directamente en el repositorio. La raíz contiene:

```text
AGENTS.md
PROJECT.template.md
PROJECT.md
MANIFEST.md
INSTALL.es.md
docs/
templates/
scripts/
src/
package.json
```

El directorio `src/` sigue siendo el del boilerplate original, con rutas TanStack en
`src/routes/` (`route.tsx` + `-components/` por feature). No existe ningún script
`apply-phase1.mjs`: los scripts de Phase 1 ya están integrados en `package.json` y la
configuración de scripts ya está ampliada en `tsconfig.scripts.json`.

## 2. Scripts y configuración

**Contrato de tooling:** npm es el package manager (`npm install` gestiona las dependencias de la aplicación); Bun es el runtime de los scripts internos de scaffolding/tooling (`generate:*`, `ai:context`, `validate:*` invocan TypeScript a través de Bun).

Los scripts de `package.json` ya incluyen los generadores y validadores:

- `generate:project`, `generate:feature`, `generate:crud`, `generate:dashboard`
- `ai:context`, `ai:context:check`
- `validate:architecture`, `validate:navigation`
- `phase1:self-test`, `typecheck`, `validate`

`tsconfig.scripts.json` ya incluye `scripts/**/*.ts` con `esm: true`. `PROJECT.md` ya existe
(a completar) y `docs/ai/generated-context.md` se genera con:

```bash
npm run ai:context
```

## 3. Completar el contrato

Edita `PROJECT.md` antes de implementar funcionalidades de producto.

No deben quedar marcadores `[Complete]`.

## 4. Verificar la instalación

```bash
npm run phase1:self-test
npm run ai:context
npm run validate
```

## 5. Crear un proyecto derivado

Con todos los ejemplos:

```bash
npm run generate:project -- inventory-admin
```

Base mínima con un solo dashboard canónico. Desde un clon limpio, la ruta recomendada es con `--install`, porque instala las dependencias del destino para que el CLI de TanStack Router pueda regenerar `src/routeTree.gen.ts`:

```bash
npm run generate:project -- inventory-admin --profile minimal --install
```

Sin un CLI disponible (ni en el destino ni en el boilerplate fuente), el perfil `minimal` falla explícitamente en lugar de entregar un route tree obsoleto.

El proyecto derivado conserva los generadores de feature, dashboard y CRUD, los validadores y el tooling de AI context para que Gentle AI pueda evolucionarlo. No conserva `generate:project` (ni `scripts/create-project.ts`, ni `templates/project/`, ni `phase1:self-test`): un proyecto derivado no puede generar otro proyecto.

Por defecto se crea como directorio hermano del boilerplate. Puedes indicar otra ruta:

```bash
npm run generate:project -- inventory-admin \
  --destination ../projects/inventory-admin \
  --profile minimal
```

Después:

```bash
cd ../inventory-admin
npm install
```

Completa su `PROJECT.md` y ejecuta:

```bash
npm run validate
```

## 6. Generadores disponibles

Feature general:

```bash
npm run generate:feature -- reports
npm run generate:feature -- reports --nav
```

Dashboard:

```bash
npm run generate:dashboard -- operations
```

CRUD:

```bash
npm run generate:crud -- customers
npm run generate:crud -- inventory-items --singular inventory-item
```

Los generadores no sobrescriben archivos salvo que se use `--force`.

### Qué esperar de cada generador

**Feature con navegación:**

```bash
npm run generate:feature -- reports --nav
```

Crea `src/routes/(main)/dashboard/reports/` con `route.tsx` (registrado con
`createFileRoute("/(main)/dashboard/reports")`, con `component`, `pendingComponent` y
`errorComponent`) y `-components/reports-{overview,pending,error}.tsx`; registra `Reports` en el
sidebar (grupo `Pages`, icono `SquareArrowUpRight`) y regenera
`docs/ai/generated-context.md`. Sin `--nav`, la ruta se crea pero queda fuera
de la navegación hasta ser aprobada.

**Dashboard (navegación activada por defecto):**

```bash
npm run generate:dashboard -- operations
```

Crea `src/routes/(main)/dashboard/operations/` con `route.tsx` y
`-components/operations-{header,kpis,activity,pending,error}.tsx`; registra
`Operations` en el grupo `Dashboards` (icono `LayoutDashboard`). Las métricas
son placeholders: hay que reemplazarlas por el boundary de servidor aprobado.
Con `--no-nav` la ruta se genera sin registro en el sidebar.

**CRUD (navegación activada por defecto):**

```bash
npm run generate:crud -- customers
```

Crea `src/routes/(main)/dashboard/customers/` con tabla, formulario, columnas,
esquema, `-data/customers.ts`, rutas `new/route.tsx` y `$id.tsx`, más componentes
pending/error. El singular (`customer`) se infiere solo; si el plural es
irregular, fíjalo con `--singular person`. `-data/` es un placeholder
compilable: reemplazarlo por el boundary de servidor antes de entregar.

### Escenarios comunes

- **El comando solo imprime la ayuda y no crea nada.** Falta el espacio después
  de `--`: `npm run generate:feature --reports` no reenvía argumentos.
  La forma correcta es `npm run generate:feature -- reports --nav`.
- **La ruta ya existe.** El generador se niega a sobrescribir. Usa `--force`
  solo cuando descartar el scaffold anterior sea intencional.
- **Generar varias rutas seguidas.** Pasa `--no-context` en cada una y corre
  `npm run ai:context` una sola vez al final.
- **CRUD recortado.** CRUD no implica todas las operaciones: si crear está fuera
  de alcance, elimina `new/`; si editar lo está, elimina `$id.tsx`.
- **Dashboard oculto.** `--no-nav` genera la ruta sin sidebar, útil tras un
  feature flag o pendiente de aprobación.
- **Proyecto derivado.** `--profile minimal` deja un solo dashboard canónico,
  elimina las apps standalone `chat` y `mail`, resetea el sidebar y regenera
  `src/routeTree.gen.ts`; `full` (por defecto) conserva todos los ejemplos.
  `--install` corre `npm install` y `--git-init` reinicia git en el destino.
- **Destino inválido.** El proyecto derivado debe quedar fuera del boilerplate;
  si el destino existe, pide `--force` explícito.
- **`--install` falla con `EALLOWSCRIPTS`.** Tu `~/.npmrc` global restringe
  los lifecycle scripts (`allow-scripts`); no es un bug del generador.
  Reintentá con una config neutra (el destino parcial requiere `--force`):
  `npm_config_userconfig=/dev/null npm run generate:project -- <name> --profile minimal --install --force`.
- **Contexto desactualizado.** Tras editar patrones o generar rutas fuera de
  línea, `npm run ai:context:check` avisa; `npm run ai:context` lo regenera.

## 7. Contexto y validaciones

Después de cambios estructurales:

```bash
npm run ai:context
```

Para comprobar que el contexto no está desactualizado:

```bash
npm run ai:context:check
```

Validaciones individuales:

```bash
npm run validate:architecture
npm run validate:navigation
```

Validación completa:

```bash
npm run validate
```

## 8. Entrada de Comet

Comet se incorpora después de que:

- `PROJECT.md` esté completo.
- Los generadores funcionen.
- `npm run phase1:self-test` pase.
- `npm run validate` pase.
- Los ejemplos canónicos hayan sido revisados.

Comet utilizará esta infraestructura; no la reemplazará.
