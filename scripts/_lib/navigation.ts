import { pathExists } from "./files.js";
import { jsString } from "./templates.js";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

interface NavigationItemInput {
  id: string;
  title: string;
  url: string;
  icon: string;
  group: string;
}

const NAVIGATION_ICON_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

/**
 * Validate a lucide-react icon reference before it is emitted as code.
 * Lucide exports are PascalCase component names; anything else would
 * produce uncompilable or misleading sidebar code.
 */
export function assertNavigationIconFormat(icon: string): void {
  if (!NAVIGATION_ICON_PATTERN.test(icon)) {
    throw new Error(
      `Invalid lucide-react icon "${icon}": expected a PascalCase Lucide export name (for example LayoutDashboard).`,
    );
  }
}

/**
 * When lucide-react is installed in the repository, verify the export
 * exists so generators fail early instead of emitting dead imports.
 * Repositories without an installed lucide-react (fixtures) only get the
 * format check above.
 */
export async function assertNavigationIconExists(repositoryRoot: string, icon: string): Promise<void> {
  const packageRoot = path.join(repositoryRoot, "node_modules", "lucide-react");
  if (!(await pathExists(packageRoot))) {
    return;
  }

  let moduleExports: Record<string, unknown>;
  try {
    moduleExports = (await import(pathToFileURL(packageRoot).href)) as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `Unable to verify lucide-react icon "${icon}": failed to import the installed lucide-react package` +
        `${error instanceof Error ? `: ${error.message}` : "."}`,
    );
  }

  if (!(icon in moduleExports)) {
    throw new Error(`Unknown lucide-react icon: ${icon}.`);
  }
}

function findMatchingBracket(source: string, openIndex: number): number {
  let depth = 0;
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (current === "\n") {
        lineComment = false;
      }
      continue;
    }

    if (blockComment) {
      if (current === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (current === "\\") {
        escaped = true;
        continue;
      }

      if (current === quote) {
        quote = null;
      }
      continue;
    }

    if (current === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (current === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (current === "'" || current === '"' || current === "`") {
      quote = current;
      continue;
    }

    if (current === "[") {
      depth += 1;
    } else if (current === "]") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  throw new Error("Unable to find the matching navigation array bracket.");
}

function ensureIconImport(source: string, icon: string): string {
  const importPattern = /import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["'];/;
  const match = source.match(importPattern);

  if (!match) {
    throw new Error("Unable to find the lucide-react import in sidebar-items.ts.");
  }

  const specifiers = match[1]
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const typeMatch = value.match(/^type\s+(\w+)$/);
      return typeMatch ? { name: typeMatch[1], prefix: "type " } : { name: value, prefix: "" };
    });

  if (specifiers.some((specifier) => specifier.name === icon)) {
    return source;
  }

  // Keep biome's sorted import order (by imported name, type modifiers
  // preserved) so generated sidebars pass `npm run check` untouched.
  const sorted = [...specifiers, { name: icon, prefix: "" }].sort((a, b) => {
    if (a.name === b.name) {
      return 0;
    }
    return a.name < b.name ? -1 : 1;
  });
  const rendered = sorted.map((specifier) => `${specifier.prefix}${specifier.name}`);

  const singleLine = `import { ${rendered.join(", ")} } from "lucide-react";`;
  if (singleLine.length <= 120) {
    return source.replace(importPattern, singleLine);
  }

  const multiline = `import {\n  ${rendered.map((name) => `${name},`).join("\n  ")}\n} from "lucide-react";`;
  return source.replace(importPattern, multiline);
}

/**
 * Create a missing navigation group at the end of sidebarItems with the
 * next numeric id, keeping biome-clean formatting. Minimal profiles only
 * ship the Dashboards group, so feature/CRUD generators rely on this to
 * register --nav entries without manual sidebar edits.
 */
function createNavigationGroup(source: string, group: string): string {
  const declaration = /export const sidebarItems[^=]*=\s*\[/;
  const declarationMatch = source.match(declaration);
  if (!declarationMatch || declarationMatch.index === undefined) {
    throw new Error("Unable to locate the sidebarItems array.");
  }
  const arrayStart = declarationMatch.index + declarationMatch[0].length - 1;
  const arrayEnd = findMatchingBracket(source, arrayStart);

  let maxId = 0;
  for (const match of source.slice(arrayStart, arrayEnd).matchAll(/\bid:\s*(\d+)/g)) {
    maxId = Math.max(maxId, Number(match[1]));
  }

  let insertAt = arrayEnd;
  while (insertAt > arrayStart && /\s/.test(source[insertAt - 1] ?? "")) {
    insertAt -= 1;
  }
  const entry = ["  {", `    id: ${maxId + 1},`, `    label: ${jsString(group)},`, "    items: [],", "  },"].join("\n");
  const snippet = insertAt === arrayStart + 1 ? `\n${entry}\n` : `\n${entry}`;

  return `${source.slice(0, insertAt)}${snippet}${source.slice(insertAt)}`;
}

/**
 * Register a sidebar entry, creating the group when it does not exist yet. URLs are public AppPaths with `(group)` segments
 * stripped (for example `/dashboard/reports`), and icons are Lucide component
 * references (not strings) matching `icon: LucideIcon` in sidebar-items.ts.
 */
export async function addNavigationItem(repositoryRoot: string, input: NavigationItemInput): Promise<boolean> {
  const navigationPath = path.join(repositoryRoot, "src", "navigation", "sidebar", "sidebar-items.ts");

  if (!(await pathExists(navigationPath))) {
    throw new Error(`Navigation file not found: ${navigationPath}`);
  }

  let source = await readFile(navigationPath, "utf8");

  assertNavigationIconFormat(input.icon);
  await assertNavigationIconExists(repositoryRoot, input.icon);

  if (source.includes(`url: "${input.url}"`) || source.includes(`url: '${input.url}'`)) {
    return false;
  }

  source = ensureIconImport(source, input.icon);

  const labelPattern = new RegExp(`label:\\s*["']${escapeRegExp(input.group)}["']`);
  let labelMatch = source.match(labelPattern);

  if (labelMatch === null) {
    source = createNavigationGroup(source, input.group);
    labelMatch = source.match(labelPattern);
  }

  if (labelMatch === null) {
    throw new Error(`Navigation group "${input.group}" was not found.`);
  }

  const labelIndex = source.indexOf(labelMatch[0]);
  const itemsIndex = source.indexOf("items:", labelIndex + labelMatch[0].length);
  const arrayStart = source.indexOf("[", itemsIndex);

  if (itemsIndex < 0 || arrayStart < 0) {
    throw new Error(`Unable to locate items for navigation group "${input.group}".`);
  }

  const arrayEnd = findMatchingBracket(source, arrayStart);
  const indentation = "      ";
  const entry = [
    `${indentation}{`,
    `${indentation}  id: ${jsString(input.id)},`,
    `${indentation}  title: ${jsString(input.title)},`,
    `${indentation}  url: ${jsString(input.url)} as AppPath,`,
    `${indentation}  icon: ${input.icon},`,
    `${indentation}},`,
  ].join("\n");

  let insertAt = arrayEnd;
  while (insertAt > arrayStart && /\s/.test(source[insertAt - 1] ?? "")) {
    insertAt -= 1;
  }
  const isEmptyArray = insertAt === arrayStart + 1;
  const snippet = isEmptyArray ? `\n${entry}\n    ` : `\n${entry}`;

  source = `${source.slice(0, insertAt)}${snippet}${source.slice(insertAt)}`;
  await writeFile(navigationPath, source, "utf8");
  return true;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
