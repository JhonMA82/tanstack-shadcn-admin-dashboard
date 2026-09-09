import { pathExists, walkFiles, writeText } from "./files.js";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export type TemplateTokens = Record<string, string>;

export function renderTemplate(content: string, tokens: TemplateTokens): string {
  let rendered = content;

  for (const [name, value] of Object.entries(tokens)) {
    rendered = rendered.replaceAll(`{{${name}}}`, value);
  }

  const unresolved = rendered.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (unresolved) {
    throw new Error(`Unresolved template tokens: ${[...new Set(unresolved)].join(", ")}`);
  }

  return rendered;
}

function renderPath(relativePath: string, tokens: TemplateTokens): string {
  let rendered = relativePath.replace(/\.tpl$/, "");

  for (const [name, value] of Object.entries(tokens)) {
    rendered = rendered.replaceAll(`__${name}__`, value);
  }

  return rendered;
}

export async function renderTemplateTree(options: {
  templateDirectory: string;
  destinationDirectory: string;
  tokens: TemplateTokens;
  force?: boolean;
}): Promise<string[]> {
  const { templateDirectory, destinationDirectory, tokens, force = false } = options;

  if (!(await pathExists(templateDirectory))) {
    throw new Error(`Template directory does not exist: ${templateDirectory}`);
  }

  const templateFiles = await walkFiles(templateDirectory, (filePath) => filePath.endsWith(".tpl"));
  const written: string[] = [];

  for (const templateFile of templateFiles) {
    const relative = path.relative(templateDirectory, templateFile);
    const destinationRelative = renderPath(relative, tokens);
    const destination = path.join(destinationDirectory, destinationRelative);
    const content = renderTemplate(await readFile(templateFile, "utf8"), tokens);

    await mkdir(path.dirname(destination), { recursive: true });
    await writeText(destination, content, { force });
    written.push(destination);
  }

  return written;
}
