import { booleanFlag, parseArgs, printUsage } from "./_lib/cli.js";
import { ensureRepositoryRoot, listDirectories, pathExists, readJson, walkFiles } from "./_lib/files.js";
import { extractNavigationUrls, scanRoutes } from "./_lib/routes.js";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface ComponentsJson {
  style?: string;
  rsc?: boolean;
  iconLibrary?: string;
  aliases?: Record<string, string>;
}

export interface GenerateAiContextOptions {
  repositoryRoot: string;
  check?: boolean;
}

function relativeList(root: string, files: string[]): string[] {
  return files.map((file) => path.relative(root, file).split(path.sep).join("/"));
}

function bulletList(values: string[], empty = "_None found._"): string {
  if (values.length === 0) {
    return empty;
  }

  return values.map((value) => `- \`${value}\``).join("\n");
}

function detectProjectStatus(content: string | null): string {
  if (!content) {
    return "missing";
  }

  return content.includes("[Complete]") ? "incomplete-template" : "configured";
}

function selectDependencyVersions(packageJson: PackageJson): Record<string, string> {
  const names = [
    "@tanstack/react-start",
    "@tanstack/react-router",
    "react",
    "typescript",
    "tailwindcss",
    "vite",
    "nitro",
    "zod",
    "react-hook-form",
    "@tanstack/react-table",
    "zustand",
    "@biomejs/biome",
    "ts-node",
  ];

  const all = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  return Object.fromEntries(names.filter((name) => all[name]).map((name) => [name, all[name] as string]));
}

export async function buildAiContext(repositoryRoot: string): Promise<string> {
  await ensureRepositoryRoot(repositoryRoot);

  const packageJson = await readJson<PackageJson>(path.join(repositoryRoot, "package.json"));
  const componentsPath = path.join(repositoryRoot, "components.json");
  const componentsJson = (await pathExists(componentsPath)) ? await readJson<ComponentsJson>(componentsPath) : {};

  const routesRoot = path.join(repositoryRoot, "src", "routes");
  const dashboardRoot = path.join(routesRoot, "(main)", "dashboard");
  const navigationPath = path.join(repositoryRoot, "src", "navigation", "sidebar", "sidebar-items.ts");

  const routes = await scanRoutes(routesRoot);
  const dashboardDirectories = await listDirectories(dashboardRoot);
  const uiFiles = relativeList(
    repositoryRoot,
    await walkFiles(path.join(repositoryRoot, "src", "components", "ui"), (file) => file.endsWith(".tsx")),
  );
  const calendarFiles = relativeList(
    repositoryRoot,
    await walkFiles(path.join(repositoryRoot, "src", "components", "calendar"), (file) => file.endsWith(".tsx")),
  );
  const sharedComponents = relativeList(
    repositoryRoot,
    (await walkFiles(path.join(repositoryRoot, "src", "components"), (file) => file.endsWith(".tsx"))).filter(
      (file) => !file.includes(`${path.sep}ui${path.sep}`) && !file.includes(`${path.sep}calendar${path.sep}`),
    ),
  );
  const hooks = relativeList(
    repositoryRoot,
    await walkFiles(path.join(repositoryRoot, "src", "hooks"), (file) => /\.(ts|tsx)$/.test(file)),
  );
  const serverModules = relativeList(
    repositoryRoot,
    await walkFiles(path.join(repositoryRoot, "src", "server"), (file) => /\.(ts|tsx)$/.test(file)),
  );
  const stores = relativeList(
    repositoryRoot,
    await walkFiles(path.join(repositoryRoot, "src", "stores"), (file) => /\.(ts|tsx)$/.test(file)),
  );
  const patterns = relativeList(
    repositoryRoot,
    await walkFiles(path.join(repositoryRoot, "docs", "patterns"), (file) => file.endsWith(".md")),
  );
  const decisions = relativeList(
    repositoryRoot,
    await walkFiles(path.join(repositoryRoot, "docs", "decisions"), (file) => /^\d+.*\.md$/.test(path.basename(file))),
  );
  const scripts = relativeList(
    repositoryRoot,
    await walkFiles(path.join(repositoryRoot, "scripts"), (file) => file.endsWith(".ts")),
  );
  const templateFiles = relativeList(
    repositoryRoot,
    await walkFiles(path.join(repositoryRoot, "templates"), (file) => file.endsWith(".tpl")),
  );

  const navigationSource = (await pathExists(navigationPath)) ? await readFile(navigationPath, "utf8") : "";
  const navigationUrls = extractNavigationUrls(navigationSource);

  const projectPath = path.join(repositoryRoot, "PROJECT.md");
  const projectContent = (await pathExists(projectPath)) ? await readFile(projectPath, "utf8") : null;

  const snapshot = {
    package: {
      name: packageJson.name ?? "unknown",
      version: packageJson.version ?? "unknown",
      dependencies: selectDependencyVersions(packageJson),
    },
    shadcn: {
      style: componentsJson.style ?? "unknown",
      rsc: componentsJson.rsc ?? null,
      ssrFirst: true,
      iconLibrary: componentsJson.iconLibrary ?? "unknown",
      aliases: componentsJson.aliases ?? {},
    },
    routes,
    dashboardDirectories,
    navigationUrls,
    uiFiles,
    calendarFiles,
    sharedComponents,
    hooks,
    serverModules,
    stores,
    patterns,
    decisions,
    scripts,
    templateFiles,
    projectStatus: detectProjectStatus(projectContent),
  };

  // The digest covers repository content only: volatile git state is
  // excluded so a committed context stays current after new commits.
  // Commit provenance lives in git history (and .boilerplate.json downstream).
  const digest = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex").slice(0, 16);

  const dependencyLines = Object.entries(snapshot.package.dependencies).map(([name, version]) => `${name}: ${version}`);
  const aliasLines = Object.entries(snapshot.shadcn.aliases).map(([name, value]) => `${name}: ${value}`);

  return `# Generated AI context

> Generated by \`npm run ai:context\`. Do not edit manually.
>
> Repository digest: \`${digest}\`

## Repository identity

- Package: \`${snapshot.package.name}\`
- Version: \`${snapshot.package.version}\`
- Project contract: \`${snapshot.projectStatus}\`
- shadcn style: \`${snapshot.shadcn.style}\`
- SSR-first (no RSC): \`true\`
- Icon library: \`${snapshot.shadcn.iconLibrary}\`

## Selected dependency versions

${bulletList(dependencyLines)}

## shadcn aliases

${bulletList(aliasLines)}

## TanStack routes

${bulletList(routes)}

## Dashboard route directories

${bulletList(dashboardDirectories)}

## Navigation URLs

${bulletList(navigationUrls)}

## Shared application components

${bulletList(sharedComponents)}

## UI primitives

${bulletList(uiFiles)}

## Calendar primitives

${bulletList(calendarFiles)}

## Hooks

${bulletList(hooks)}

## Server modules

${bulletList(serverModules)}

## Stores

${bulletList(stores)}

## Architecture decisions

${bulletList(decisions)}

## Implementation patterns

${bulletList(patterns)}

## Repository scripts

${bulletList(scripts)}

## Generator templates

${bulletList(templateFiles)}

## Agent loading guidance

For a task, load:

1. \`PROJECT.md\`.
2. \`docs/architecture.md\`.
3. One applicable pattern.
4. \`docs/ai/canonical-examples.yaml\`.
5. One or two selected examples.
6. The target route and direct dependencies.

Do not load every route or primitive unless the task requires a repository-wide change.
`;
}

export async function generateAiContext(options: GenerateAiContextOptions): Promise<void> {
  const outputPath = path.join(options.repositoryRoot, "docs", "ai", "generated-context.md");
  const generated = await buildAiContext(options.repositoryRoot);

  if (options.check) {
    const current = (await pathExists(outputPath)) ? await readFile(outputPath, "utf8") : null;

    if (current !== generated) {
      throw new Error("docs/ai/generated-context.md is stale. Run npm run ai:context and commit the result.");
    }

    console.log("AI context is current.");
    return;
  }

  await writeFile(outputPath, generated, "utf8");
  console.log(`Generated ${path.relative(options.repositoryRoot, outputPath)}.`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.flags.has("help")) {
    printUsage([
      "Generate or verify the compact AI repository context.",
      "",
      "Usage:",
      "  npm run ai:context",
      "  npm run ai:context:check",
      "",
      "Options:",
      "  --check",
    ]);
    return;
  }

  await generateAiContext({
    repositoryRoot: process.cwd(),
    check: booleanFlag(args, "check"),
  });
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
