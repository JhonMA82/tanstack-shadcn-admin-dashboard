import { pathExists } from "./files.js";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

interface NavigationItemInput {
  id: string;
  title: string;
  url: string;
  icon: string;
  group: string;
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

  const importedNames = match[1]
    .split(",")
    .map((value) => value.trim().replace(/^type\s+/, ""))
    .filter(Boolean);

  if (importedNames.includes(icon)) {
    return source;
  }

  const body = match[1];
  const typeIndex = body.indexOf("type LucideIcon");
  const insertionIndex = typeIndex >= 0 ? typeIndex : body.length;
  const updatedBody = `${body.slice(0, insertionIndex)}${icon},\n  ${body.slice(insertionIndex)}`;

  return source.replace(importPattern, `import {${updatedBody}} from "lucide-react";`);
}

/**
 * Register a sidebar entry. URLs are public AppPaths with `(group)` segments
 * stripped (for example `/dashboard/reports`), and icons are Lucide component
 * references (not strings) matching `icon: LucideIcon` in sidebar-items.ts.
 */
export async function addNavigationItem(repositoryRoot: string, input: NavigationItemInput): Promise<boolean> {
  const navigationPath = path.join(repositoryRoot, "src", "navigation", "sidebar", "sidebar-items.ts");

  if (!(await pathExists(navigationPath))) {
    throw new Error(`Navigation file not found: ${navigationPath}`);
  }

  let source = await readFile(navigationPath, "utf8");

  if (source.includes(`url: "${input.url}"`) || source.includes(`url: '${input.url}'`)) {
    return false;
  }

  source = ensureIconImport(source, input.icon);

  const labelPattern = new RegExp(`label:\\s*["']${escapeRegExp(input.group)}["']`);
  const labelMatch = source.match(labelPattern);

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
  const snippet = [
    "",
    `${indentation}{`,
    `${indentation}  id: "${input.id}",`,
    `${indentation}  title: "${input.title}",`,
    `${indentation}  url: "${input.url}" as AppPath,`,
    `${indentation}  icon: ${input.icon},`,
    `${indentation}},`,
    "    ",
  ].join("\n");

  source = `${source.slice(0, arrayEnd)}${snippet}${source.slice(arrayEnd)}`;
  await writeFile(navigationPath, source, "utf8");
  return true;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
