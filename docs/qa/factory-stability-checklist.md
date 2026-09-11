# Lista de estabilidad del factory (boilerplate TanStack)

Protocolo manual para validar que el factory es **estable** y apto para release.
Cada prueba indica el comando, el resultado esperado y el criterio de fallo.
Todas las pruebas deben pasar; una sola en rojo invalida el release.

> Alcance: solo el factory y sus proyectos derivados. No cambia arquitectura
> (TanStack Start + Router, SSR-first, npm + Bun para tooling).

## Prerrequisitos

- Clon limpio de la rama a validar.
- `node` + `npm` instalados; **Bun** instalado (runtime de `generate:*`, `ai:context`, `validate:*`).
- Red disponible (instalaciones `npm ci` / `npm install`).
- Directorio temporal fuera del factory, p. ej. `/tmp/ep-stability`.

Registrar al inicio:

```text
rama:      feat/phase1-scaffolding
commit:    <sha>
tag:       <vX.Y.Z>
fecha:     <AAAA-MM-DD>
ejecutado por: <nombre>
```

## A. Factory fuente

Desde un clon limpio:

```bash
npm ci
npm run phase1:self-test
npm run validate
```

### A1. `npm ci`

- Esperado: `added <N> packages`, exit 0.
- Fallo: cualquier error de resolución (revisar `package-lock.json`).

### A2. `npm run phase1:self-test`

- Esperado: `Phase 1 self-test passed.` y las 18 líneas (todas `passed`):
  - Feature generator / Feature generator with --nav
  - Navigation matrix (defaults, opt-outs, custom, idempotent, duplicate)
  - Dashboard generator / CRUD generator / CRUD generator with --singular
  - Project generator / Derived scaffolding contract
  - Derived source-only artifacts removed (incl. PI_*.md)
  - Minimal route tree (source CLI) / Minimal route set matches filesystem
  - Minimal route tree (destination CLI) / Minimal without CLI fails explicitly
  - Feature --nav creates missing group
  - npm policy failure detection
  - AI context generation / Architecture validation / Navigation validation
- Fallo: cualquier línea ausente o excepción (`throw`).

### A3. `npm run validate`

- Esperado: `check` (Biome, `Checked 267 files`, 0 errores), `typecheck`,
  `validate:architecture`, `validate:navigation`, `ai:context:check` y `build`
  (`✓ built in ...`) en verde, exit 0.
- Fallo: detenerse en el primer paso en rojo y corregirlo; no continuar con B–F.

## B. Proyecto derivado `full`

```bash
npm run generate:project -- ep-full --profile full --destination /tmp/ep-stability/ep-full
```

### B1. Limpieza estricta (archivos fuente que NO deben existir)

Verificar ausencia de cada uno (ninguno debe existir):

```text
scripts/create-project.ts
scripts/self-test.ts
templates/project/
INSTALL.es.md
MANIFEST.md
PROJECT.template.md
PI_*.md
```

- Esperado: todos ausentes.
- Fallo: cualquier filtración (`LEAK`) invalida el release.

### B2. Capacidades que SÍ deben permanecer

Verificar presencia:

```text
scripts/create-feature.ts
scripts/create-dashboard.ts
scripts/create-crud.ts
scripts/generate-ai-context.ts
scripts/validate-architecture.ts
scripts/validate-navigation.ts
templates/feature/  templates/dashboard/  templates/crud/
AGENTS.md  PROJECT.md  docs/ai/
```

- Esperado: todos presentes y `PROJECT.md` renderizado con título/descripción.
- Fallo: cualquier ausente (`MISSING`).

### B3. Identidad y contrato

- `package.json`: `name: ep-full`, `version: 0.1.0`, sin scripts
  `generate:project` ni `phase1:self-test`.
- `docs/ai/project-map.yaml`: sin línea `generateProject:`.
- `.boilerplate.json`: `sourceVersion` = versión del factory,
  `sourceCommit` = sha no vacío, `profile: full`.
- Fallo: cualquier campo incorrecto o ausente.

### B4. Validación del derivado

```bash
cd /tmp/ep-stability/ep-full && npm ci && npm run validate
```

- Esperado: instalación limpia y `validate` en verde hasta `✓ built`.
- Fallo: error de instalación o de validación.

## C. Proyecto derivado `minimal`

```bash
npm run generate:project -- ep-minimal --profile minimal --install \
  --destination /tmp/ep-stability/ep-minimal
```

### C1. Generación

- Esperado: log `Regenerated src/routeTree.gen.ts for the minimal profile.`
  y `Created derived project: ...`, exit 0.
- Fallo: si el CLI del router no se resuelve, el generador debe **fallar con
  mensaje explícito** (nunca entregar un route tree desactualizado).

### C2. Rutas demo eliminadas

- Esperado: no existen `src/routes/(main)/dashboard/crm`,
  `src/routes/(main)/dashboard/finance`, `src/routes/(main)/chat`,
  `src/routes/(main)/mail`; `src/routeTree.gen.ts` no los menciona;
  la ruta `/dashboard/default` sí existe.
- Fallo: cualquier ruta demo presente en disco o en el route tree.

### C3. Consistencia

- `sidebar-items.ts` coincide con el perfil minimal (sin entradas a rutas eliminadas).
- `docs/ai/canonical-examples.yaml` es el del perfil minimal.
- `src/routeTree.gen.ts` nunca fue editado a mano (solo vía CLI `tsr`).
- Limpieza B1–B3: aplica igual que en `full`.
- Fallo: cualquier inconsistencia.

### C4. Validación del derivado

```bash
cd /tmp/ep-stability/ep-minimal && npm run validate
```

- Esperado: verde hasta `✓ built` (las dependencias ya se instalaron con `--install`).
- Fallo: error de validación.

## D. Andamiaje estilo Gentle (dentro de un derivado fresco)

```bash
cd /tmp/ep-stability/ep-minimal
npm run generate:feature -- reports --nav
npm run generate:dashboard -- operations
npm run generate:crud -- inventory-items --singular inventory-item
npm run ai:context
npm run validate
```

Verificar después de cada scaffold:

| Aspecto | Esperado |
| --- | --- |
| Directorio de ruta | `src/routes/(main)/dashboard/<nombre>/route.tsx` existe |
| Código privado | `-components/` bajo la ruta propietaria |
| Patrón de ruta | `createFileRoute("/(main)/dashboard/<nombre>")` con `pendingComponent` y `errorComponent` |
| Route tree | `src/routeTree.gen.ts` regenerado e incluye la ruta |
| Sidebar | `reports`, `operations`, `inventory-items` presentes solo si se pidió navegación |
| Contexto IA | `docs/ai/generated-context.md` actualizado |
| `validate` final | verde hasta `✓ built` |

- Fallo: ruta ausente del tree, sidebar incorrecto o validate en rojo.

## E. Matriz de argumentos extendidos

Ejecutar como mínimo (combinar con `--no-context` para ir más rápido y cerrar
con `npm run ai:context` + `npm run validate`):

```text
feature --description / --nav-group / --nav-icon / --nav-title
dashboard --description / --no-nav / --nav-icon / --nav-title
crud --description / --no-nav / --nav-group / --nav-icon / --nav-title / --singular
duplicado sin --force  ->  debe RECHAZAR (exit != 0, "Refusing to overwrite...")
duplicado con --force  ->  debe reemplazar y regenerar el route tree
--no-context           ->  omite regenerar contexto (luego ai:context lo actualiza)
```

Casos de navegación a verificar explícitamente:

```text
feature sin --nav          -> sin entrada en sidebar
feature --nav              -> entrada creada
feature --nav-group Pages / Dashboards (grupo inexistente -> se crea)
feature con icono/título custom   -> valores literales en sidebar-items.ts
dashboard por defecto      -> con navegación (grupo Dashboards)
dashboard --no-nav         -> sin entrada
CRUD por defecto           -> con navegación
CRUD --no-nav              -> sin entrada
CRUD grupo/icono/título custom -> valores literales
repetir scaffold           -> sin entradas duplicadas
```

- Esperado: `npm run validate:navigation` en verde; URLs tipo `/dashboard/<x>`
  (sin grupos de ruta); iconos como referencias a componentes Lucide, no strings.
- Fallo: duplicados, grupo ausente, URL inválida o validate en rojo.

## F. Invariantes de arquitectura (no regresión)

Sobre fuente y derivados, verificar que no se introdujo:

```text
TanStack Start + Router con file-based routing, SSR-first, sin RSC, sin "use client",
browser-only aislado (effects / <ClientOnly> / createClientOnlyFn),
createServerFn con validación en bordes de confianza,
código privado bajo -components/-schemas/-data/-lib,
src/components/ui/** y src/components/calendar/** intactos,
sin imports privados entre features,
server/utilidades sin depender de módulos de ruta,
tokens semánticos de tema, sin rutas (legacy) como referencia,
estado compartible en URL donde aplique, TypeScript estricto,
route tree solo generado.
```

- Esperado: `validate` cubre lo ejecutable; el resto por revisión del diff.
- Fallo: cualquier regresión bloquea el release.

## Criterio de aceptación (READY)

Marcar **READY** solo si todo lo siguiente es ✅:

- [ ] A1–A3 en verde desde clon limpio.
- [ ] B1–B4: `full` genera, limpia, identifica y valida.
- [ ] C1–C4: `minimal` genera con route tree regenerado y valida.
- [ ] El derivado no puede llamar a `generate:project`.
- [ ] Sin filtración de artefactos source-only.
- [ ] Feature/dashboard/CRUD disponibles y regeneran el route tree.
- [ ] Navegación correcta en todos los modos probados.
- [ ] `project-map.yaml` expone el contrato de scaffolding.
- [ ] Tooling npm/Bun machine-readable y documentado.
- [ ] Metadatos de versión/procedencia exactos.
- [ ] Determinismo de dependencias resuelto intencionalmente.
- [ ] Sin cambios de arquitectura.

## Registro de resultados

Copiar esta tabla al validar un release y archivarla (p. ej. en el PR):

```text
release:  vX.Y.Z   commit: <sha>   fecha: <AAAA-MM-DD>   por: <nombre>
A. fuente:            PASS / FAIL (...)
B. full:              PASS / FAIL (...)
C. minimal:           PASS / FAIL (...)
D. scaffolding:       PASS / FAIL (...)
E. args extendidos:   PASS / FAIL (...)
F. invariantes:       PASS / FAIL (...)
veredicto:            READY / NOT READY
riesgos residuales:
- ...
```
