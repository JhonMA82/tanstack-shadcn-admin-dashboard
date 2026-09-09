import { booleanFlag, parseArgs, printUsage } from "./_lib/cli.js";
import { ensureRepositoryRoot, pathExists } from "./_lib/files.js";
import {
  extractNavigationIds,
  extractNavigationUrls,
  isExternalUrl,
  routeIdToUrl,
  routeMatchesUrl,
  scanRoutes,
} from "./_lib/routes.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface NavigationValidationResult {
  routes: string[];
  navigationUrls: string[];
  errors: string[];
  warnings: string[];
}

function duplicates(values: string[]): string[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort((a, b) => a.localeCompare(b));
}

export async function validateNavigation(repositoryRoot: string): Promise<NavigationValidationResult> {
  await ensureRepositoryRoot(repositoryRoot);

  const navigationPath = path.join(repositoryRoot, "src", "navigation", "sidebar", "sidebar-items.ts");

  if (!(await pathExists(navigationPath))) {
    return {
      routes: [],
      navigationUrls: [],
      errors: [`Navigation file not found: ${navigationPath}`],
      warnings: [],
    };
  }

  const source = await readFile(navigationPath, "utf8");
  const navigationUrls = extractNavigationUrls(source);
  const navigationIds = extractNavigationIds(source);
  const routes = await scanRoutes(path.join(repositoryRoot, "src", "routes"));
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const duplicate of duplicates(navigationIds)) {
    errors.push(`Duplicate navigation id: ${duplicate}`);
  }

  for (const duplicate of duplicates([...source.matchAll(/\burl:\s*["']([^"']+)["']/g)].map((match) => match[1]))) {
    warnings.push(`Duplicate navigation URL: ${duplicate}`);
  }

  const iconImport = source.match(/import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["'];/);
  const importedIcons = new Set(
    (iconImport?.[1] ?? "")
      .split(",")
      .map((value) => value.trim().replace(/^type\s+/, ""))
      .filter(Boolean),
  );
  const referencedIcons = new Set([...source.matchAll(/\bicon:\s*([A-Za-z][A-Za-z0-9]*)/g)].map((match) => match[1]));

  for (const icon of referencedIcons) {
    if (!importedIcons.has(icon)) {
      errors.push(`Navigation icon is not imported from lucide-react: ${icon}`);
    }
  }

  for (const url of navigationUrls) {
    if (isExternalUrl(url)) {
      continue;
    }

    const normalizedUrl = routeIdToUrl(url);

    if (!routes.some((route) => routeMatchesUrl(route, normalizedUrl))) {
      errors.push(`Navigation URL does not resolve to a TanStack route (AppPath): ${url}`);
    }
  }

  return { routes, navigationUrls, errors, warnings };
}

function printResult(result: NavigationValidationResult): void {
  for (const error of result.errors) {
    console.log(`ERROR ${error}`);
  }

  for (const warning of result.warnings) {
    console.log(`WARNING ${warning}`);
  }

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log(
      `Navigation validation passed for ${result.navigationUrls.length} URLs and ${result.routes.length} routes.`,
    );
  } else {
    console.log(`Navigation validation: ${result.errors.length} errors, ${result.warnings.length} warnings.`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.flags.has("help")) {
    printUsage([
      "Validate sidebar IDs and route targets.",
      "",
      "Usage:",
      "  npm run validate:navigation",
      "",
      "Options:",
      "  --json",
      "  --strict-warnings",
    ]);
    return;
  }

  const result = await validateNavigation(process.cwd());

  if (booleanFlag(args, "json")) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printResult(result);
  }

  if (result.errors.length > 0 || (booleanFlag(args, "strict-warnings") && result.warnings.length > 0)) {
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
