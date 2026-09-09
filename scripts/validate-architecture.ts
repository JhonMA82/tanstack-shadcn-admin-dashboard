import { booleanFlag, parseArgs, printUsage } from "./_lib/cli.js";
import { ensureRepositoryRoot, walkFiles } from "./_lib/files.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type FindingSeverity = "error" | "warning";

export interface ArchitectureFinding {
  severity: FindingSeverity;
  code: string;
  file: string;
  message: string;
}

export interface ArchitectureValidationResult {
  findings: ArchitectureFinding[];
  errorCount: number;
  warningCount: number;
}

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
// Generated files are build artifacts, never hand-written source.
const GENERATED_BASENAMES = new Set(["routeTree.gen.ts"]);
// Protected shadcn primitives legitimately carry "use client" (upstream
// shadcn/base-nova output) and must not be flagged: AGENTS.md forbids
// modifying src/components/ui and src/components/calendar.
const PRIMITIVE_MARKERS = [
  `${path.sep}components${path.sep}ui${path.sep}`,
  `${path.sep}components${path.sep}calendar${path.sep}`,
];
const PRIVATE_SEGMENTS = new Set(["-components", "-schemas", "-data", "-lib"]);
const LEGACY_PRIVATE_SEGMENTS = new Set(["_components", "_schemas", "_data", "_lib"]);
const RAW_COLOR_PATTERN =
  /(?:#[0-9a-fA-F]{3,8}\b|(?:rgb|hsl|oklch)a?\s*\(|\b(?:bg|text|border|fill|stroke)-\[[^\]]+\])/;
const EXPLICIT_ANY_PATTERN = /(?:^|[<(:,\s])any(?:[>\]),;\s]|$)/m;
const BROWSER_API_PATTERN = /\b(window|document|localStorage|sessionStorage|navigator)\b/;
const EFFECT_GUARD_PATTERN = /\b(useEffect|useLayoutEffect|useInsertionEffect|createClientOnlyFn|ClientOnly)\b/;

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function parseImports(source: string): string[] {
  const staticImports = [
    ...source.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g),
  ].map((match) => match[1]);

  const dynamicImports = [...source.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)].map((match) => match[1]);

  return [...new Set([...staticImports, ...dynamicImports])];
}

function resolveImport(repositoryRoot: string, sourceFile: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) {
    return path.join(repositoryRoot, "src", specifier.slice(2));
  }

  if (specifier.startsWith("#/")) {
    return path.join(repositoryRoot, "src", specifier.slice(2));
  }

  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(sourceFile), specifier);
  }

  return null;
}

interface FeatureInfo {
  name: string | null;
  legacy: boolean;
  privateSegment: string | null;
  legacyPrivateSegment: string | null;
}

function featureInfo(repositoryRoot: string, targetPath: string): FeatureInfo {
  const dashboardRoot = normalizeSlash(path.join(repositoryRoot, "src", "routes", "(main)", "dashboard"));
  const normalized = normalizeSlash(targetPath);

  if (!normalized.startsWith(`${dashboardRoot}/`)) {
    return { name: null, legacy: false, privateSegment: null, legacyPrivateSegment: null };
  }

  const relativeSegments = normalized.slice(dashboardRoot.length + 1).split("/");
  let legacy = false;
  let feature: string | null = null;

  for (const segment of relativeSegments) {
    if (segment.startsWith("(") && segment.endsWith(")")) {
      if (segment === "(legacy)") {
        legacy = true;
      }
      continue;
    }

    if (segment.startsWith("$")) {
      continue;
    }

    if (
      PRIVATE_SEGMENTS.has(segment) ||
      LEGACY_PRIVATE_SEGMENTS.has(segment) ||
      SOURCE_EXTENSIONS.includes(path.extname(segment))
    ) {
      break;
    }

    feature = segment;
    break;
  }

  const privateSegment = feature ? (relativeSegments.find((segment) => PRIVATE_SEGMENTS.has(segment)) ?? null) : null;
  const legacyPrivateSegment = feature
    ? (relativeSegments.find((segment) => LEGACY_PRIVATE_SEGMENTS.has(segment)) ?? null)
    : null;

  return { name: feature, legacy, privateSegment, legacyPrivateSegment };
}

function isSourceFile(filePath: string): boolean {
  return SOURCE_EXTENSIONS.includes(path.extname(filePath)) && !filePath.endsWith(".d.ts");
}

function displayPath(repositoryRoot: string, filePath: string): string {
  return normalizeSlash(path.relative(repositoryRoot, filePath));
}

function addFinding(findings: ArchitectureFinding[], finding: ArchitectureFinding): void {
  findings.push(finding);
}

export async function validateArchitecture(repositoryRoot: string): Promise<ArchitectureValidationResult> {
  await ensureRepositoryRoot(repositoryRoot);

  const sourceRoot = path.join(repositoryRoot, "src");
  const sourceFiles = await walkFiles(sourceRoot, isSourceFile);
  const findings: ArchitectureFinding[] = [];

  for (const filePath of sourceFiles) {
    if (GENERATED_BASENAMES.has(path.basename(filePath))) {
      continue;
    }

    const relative = displayPath(repositoryRoot, filePath);
    const source = await readFile(filePath, "utf8");
    const normalized = normalizeSlash(filePath);
    const withoutBom = source.replace(/^\uFEFF/, "");
    const sourceFeature = featureInfo(repositoryRoot, filePath);

    if (/(^|\n)\s*["']use client["']\s*;?/.test(withoutBom)) {
      const isProtectedPrimitive = PRIMITIVE_MARKERS.some((marker) => normalized.includes(marker));

      if (!isProtectedPrimitive) {
        addFinding(findings, {
          severity: "error",
          code: "USE_CLIENT_DIRECTIVE",
          file: relative,
          message:
            "This project does not use React Server Components. Remove the use client directive and isolate browser behavior in effects, guarded client code, <ClientOnly>, or createClientOnlyFn.",
        });
      }
    }

    if (path.basename(filePath) === "route.tsx" && BROWSER_API_PATTERN.test(source)) {
      if (!EFFECT_GUARD_PATTERN.test(source)) {
        addFinding(findings, {
          severity: "error",
          code: "BROWSER_API_IN_ROUTE",
          file: relative,
          message:
            "route.tsx must stay SSR-safe. Move browser-only APIs into effects, guarded client code, <ClientOnly>, or createClientOnlyFn.",
        });
      }
    }

    if (
      normalized.includes(`${path.sep}routes${path.sep}(main)${path.sep}dashboard${path.sep}`) &&
      !sourceFeature.legacy &&
      RAW_COLOR_PATTERN.test(source)
    ) {
      addFinding(findings, {
        severity: "warning",
        code: "RAW_FEATURE_COLOR",
        file: relative,
        message:
          "Feature code contains a raw or arbitrary color. Prefer semantic theme tokens unless explicitly required.",
      });
    }

    if (sourceFeature.legacyPrivateSegment && !sourceFeature.legacy) {
      addFinding(findings, {
        severity: "warning",
        code: "LEGACY_PRIVATE_SEGMENT",
        file: relative,
        message: `Route-private code uses legacy ${sourceFeature.legacyPrivateSegment}/. Prefer the dash-prefixed equivalent.`,
      });
    }

    if (EXPLICIT_ANY_PATTERN.test(source)) {
      addFinding(findings, {
        severity: "warning",
        code: "EXPLICIT_ANY",
        file: relative,
        message: "Explicit any weakens the repository's type contract.",
      });
    }

    for (const specifier of parseImports(source)) {
      const resolved = resolveImport(repositoryRoot, filePath, specifier);
      if (!resolved) {
        continue;
      }

      const targetFeature = featureInfo(repositoryRoot, resolved);
      const targetNormalized = normalizeSlash(resolved);

      if (
        sourceFeature.name &&
        targetFeature.name &&
        sourceFeature.name !== targetFeature.name &&
        targetFeature.privateSegment
      ) {
        addFinding(findings, {
          severity: "error",
          code: "CROSS_FEATURE_PRIVATE_IMPORT",
          file: relative,
          message:
            `Imports private ${targetFeature.privateSegment} code from feature ` +
            `"${targetFeature.name}". Promote a proven shared abstraction instead.`,
        });
      }

      if (!sourceFeature.legacy && targetFeature.legacy) {
        addFinding(findings, {
          severity: "error",
          code: "LEGACY_IMPORT",
          file: relative,
          message: "New or current code imports a legacy route implementation.",
        });
      }

      if (
        (normalized.includes(`${path.sep}components${path.sep}ui${path.sep}`) ||
          normalized.includes(`${path.sep}components${path.sep}calendar${path.sep}`)) &&
        targetNormalized.includes(normalizeSlash(path.join("src", "routes", "(main)", "dashboard")))
      ) {
        addFinding(findings, {
          severity: "error",
          code: "PRIMITIVE_DEPENDS_ON_FEATURE",
          file: relative,
          message: "A protected primitive depends on dashboard feature code.",
        });
      }

      if (
        normalized.includes(`${path.sep}server${path.sep}`) &&
        (targetNormalized.includes(`${path.sep}src${path.sep}routes${path.sep}`) ||
          targetNormalized.includes(`${path.sep}src${path.sep}app${path.sep}`))
      ) {
        addFinding(findings, {
          severity: "error",
          code: "SERVER_IMPORTS_ROUTE",
          file: relative,
          message: "Server/domain code must not depend on route modules.",
        });
      }

      if (
        normalized.includes(`${path.sep}lib${path.sep}`) &&
        (targetNormalized.includes(`${path.sep}src${path.sep}routes${path.sep}`) ||
          targetNormalized.includes(`${path.sep}src${path.sep}app${path.sep}`))
      ) {
        addFinding(findings, {
          severity: "error",
          code: "LIB_IMPORTS_ROUTE",
          file: relative,
          message: "Utility code must not depend on route modules.",
        });
      }
    }
  }

  findings.sort((a, b) => {
    let severityOrder = 0;
    if (a.severity !== b.severity) {
      severityOrder = a.severity === "error" ? -1 : 1;
    }
    return severityOrder || a.file.localeCompare(b.file) || a.code.localeCompare(b.code);
  });

  return {
    findings,
    errorCount: findings.filter((finding) => finding.severity === "error").length,
    warningCount: findings.filter((finding) => finding.severity === "warning").length,
  };
}

function printResult(result: ArchitectureValidationResult): void {
  if (result.findings.length === 0) {
    console.log("Architecture validation passed with no findings.");
    return;
  }

  for (const finding of result.findings) {
    console.log(`${finding.severity.toUpperCase()} ${finding.code} ${finding.file}: ${finding.message}`);
  }

  console.log(`Architecture validation: ${result.errorCount} errors, ${result.warningCount} warnings.`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.flags.has("help")) {
    printUsage([
      "Validate high-confidence architecture invariants.",
      "",
      "Usage:",
      "  npm run validate:architecture",
      "  npm run validate:architecture -- --strict-warnings",
      "",
      "Options:",
      "  --strict-warnings  Treat warnings as failures.",
      "  --json             Emit machine-readable output.",
    ]);
    return;
  }

  const result = await validateArchitecture(process.cwd());

  if (booleanFlag(args, "json")) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printResult(result);
  }

  const strictWarnings = booleanFlag(args, "strict-warnings");
  if (result.errorCount > 0 || (strictWarnings && result.warningCount > 0)) {
    process.exit(1);
  }
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
