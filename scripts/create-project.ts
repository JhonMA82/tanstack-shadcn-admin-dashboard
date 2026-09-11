import { booleanFlag, parseArgs, printUsage, stringFlag } from "./_lib/cli.js";
import { ensureRepositoryRoot, pathExists, readJson, writeJson } from "./_lib/files.js";
import { assertKebabCase, titleCase } from "./_lib/naming.js";
import { resolveTsrBinary } from "./_lib/routes.js";
import { renderTemplate } from "./_lib/templates.js";
import { generateAiContext } from "./generate-ai-context.js";
import { spawn, spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

interface PackageLock {
  name?: string;
  version?: string;
  packages?: Record<string, { name?: string; version?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

type ProjectProfile = "full" | "minimal";

export interface CreateProjectOptions {
  repositoryRoot: string;
  name: string;
  destination?: string;
  title?: string;
  description?: string;
  profile?: ProjectProfile;
  force?: boolean;
  initializeGit?: boolean;
  installDependencies?: boolean;
}

const COPY_EXCLUSIONS = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "dist",
  ".turbo",
  ".DS_Store",
  ".codegraph",
  ".atl",
]);

async function copyRepository(sourceRoot: string, destination: string): Promise<void> {
  await cp(sourceRoot, destination, {
    recursive: true,
    errorOnExist: false,
    force: true,
    filter(source) {
      const relative = path.relative(sourceRoot, source);
      if (!relative) {
        return true;
      }

      return !relative.split(path.sep).some((segment) => COPY_EXCLUSIONS.has(segment));
    },
  });
}

const DERIVED_SOURCE_ONLY_SCRIPT_PATTERN = /^\s*"(generate:project|phase1:self-test)"\s*:/;

async function updatePackageIdentity(destination: string, packageName: string): Promise<{ sourceVersion: string }> {
  const packagePath = path.join(destination, "package.json");
  const raw = await readFile(packagePath, "utf8");
  let packageJson: PackageJson;
  try {
    packageJson = JSON.parse(raw) as PackageJson;
  } catch (error) {
    throw new Error(`Failed to parse JSON at ${packagePath}: ${error instanceof Error ? error.message : error}`);
  }
  const sourceVersion = (packageJson.version as string | undefined) ?? "unknown";

  // Format-preserving text edits: a JSON round-trip would reflow arrays such as
  // lint-staged and break `npm run check` (biome) in the derived project.
  let replacedName = false;
  let replacedVersion = false;
  let replacedPrivate = false;
  const kept: string[] = [];
  for (const line of raw.split("\n")) {
    if (!replacedName && /^\s*"name"\s*:/.test(line)) {
      kept.push(line.replace(/:\s*"[^"]*"/, `: "${packageName}"`));
      replacedName = true;
      continue;
    }
    if (!replacedVersion && /^\s*"version"\s*:/.test(line)) {
      kept.push(line.replace(/:\s*"[^"]*"/, ': "0.1.0"'));
      replacedVersion = true;
      continue;
    }
    if (!replacedPrivate && /^\s*"private"\s*:/.test(line)) {
      kept.push(line.replace(/:\s*\w+/, ": true"));
      replacedPrivate = true;
      continue;
    }
    if (DERIVED_SOURCE_ONLY_SCRIPT_PATTERN.test(line)) {
      continue;
    }
    kept.push(line);
  }

  // Repair a trailing comma only if dropping a script line orphaned one.
  // Valid JSON input contains no `,}` sequence, so any match is our breakage.
  const text = kept.join("\n").replace(/,(\s*})/g, "$1");

  let parsed: PackageJson;
  try {
    parsed = JSON.parse(text) as PackageJson;
  } catch {
    // Fall back to a semantic rewrite if the source layout ever defeats the
    // surgical edit; formatting drift is preferable to invalid JSON.
    packageJson.name = packageName;
    packageJson.version = "0.1.0";
    packageJson.private = true;
    const scripts = packageJson.scripts;
    if (scripts) {
      for (const scriptName of DERIVED_SOURCE_ONLY_SCRIPTS) {
        delete scripts[scriptName];
      }
    }
    await writeJson(packagePath, packageJson);
    return { sourceVersion };
  }

  if (parsed.name !== packageName || parsed.version !== "0.1.0") {
    throw new Error("Derived package identity was not updated correctly.");
  }
  await writeFile(packagePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");

  const lockPath = path.join(destination, "package-lock.json");
  if (await pathExists(lockPath)) {
    const packageLock = await readJson<PackageLock>(lockPath);
    packageLock.name = packageName;
    packageLock.version = "0.1.0";

    if (packageLock.packages?.[""]) {
      packageLock.packages[""].name = packageName;
      packageLock.packages[""].version = "0.1.0";
    }

    await writeJson(lockPath, packageLock);
  }

  return { sourceVersion };
}

async function writeProjectContract(options: {
  destination: string;
  title: string;
  description: string;
  sourceVersion: string;
  sourceCommit: string;
}): Promise<void> {
  const templatePath = path.join(options.destination, "templates", "project", "PROJECT.md.tpl");
  const template = await readFile(templatePath, "utf8");

  const rendered = renderTemplate(template, {
    PROJECT_TITLE: options.title,
    PROJECT_DESCRIPTION: options.description,
    SOURCE_VERSION: options.sourceVersion,
    SOURCE_COMMIT: options.sourceCommit,
  });

  await writeFile(path.join(options.destination, "PROJECT.md"), rendered, "utf8");
}

function sourceCommit(repositoryRoot: string): string {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

  return result.status === 0 ? result.stdout.trim() : "unavailable";
}

interface MinimalProfileConfig {
  removeDashboardDirectories: string[];
  removeStandaloneDirectories?: string[];
}

async function applyMinimalProfile(destination: string): Promise<void> {
  const configPath = path.join(destination, "templates", "project", "minimal-profile.json");
  const config = await readJson<MinimalProfileConfig>(configPath);
  const dashboardRoot = path.join(destination, "src", "routes", "(main)", "dashboard");

  for (const directory of config.removeDashboardDirectories) {
    await rm(path.join(dashboardRoot, directory), { recursive: true, force: true });
  }

  const standaloneRoot = path.join(destination, "src", "routes", "(main)");

  for (const directory of config.removeStandaloneDirectories ?? []) {
    await rm(path.join(standaloneRoot, directory), { recursive: true, force: true });
  }

  const sidebarTemplate = await readFile(
    path.join(destination, "templates", "project", "minimal-sidebar-items.ts.tpl"),
    "utf8",
  );
  await mkdir(path.join(destination, "src", "navigation", "sidebar"), { recursive: true });
  await writeFile(path.join(destination, "src", "navigation", "sidebar", "sidebar-items.ts"), sidebarTemplate, "utf8");

  const canonicalTemplate = await readFile(
    path.join(destination, "templates", "project", "minimal-canonical-examples.yaml.tpl"),
    "utf8",
  );
  await writeFile(path.join(destination, "docs", "ai", "canonical-examples.yaml"), canonicalTemplate, "utf8");
}

async function regenerateMinimalRouteTree(repositoryRoot: string, destination: string): Promise<void> {
  const tsrBinary = await resolveTsrBinary(repositoryRoot, destination);

  if (!tsrBinary) {
    throw new Error(
      "Unable to regenerate TanStack Router route tree for the minimal profile: " +
        "TanStack Router CLI (tsr) not found in the destination or the boilerplate source. " +
        "Use --install or install the boilerplate dependencies before generating the project.",
    );
  }

  const result = spawnSync(tsrBinary, ["generate"], { cwd: destination, encoding: "utf8" });

  if (result.status !== 0) {
    const details = typeof result.stderr === "string" && result.stderr.trim() ? `: ${result.stderr.trim()}` : ".";
    throw new Error(
      "Unable to regenerate TanStack Router route tree for the minimal profile" +
        `${details} Fix the route tree with \`npm run generate-routes\` after installing dependencies.`,
    );
  }

  console.log("Regenerated src/routeTree.gen.ts for the minimal profile.");
}

const DERIVED_SOURCE_ONLY_FILES = [
  path.join("scripts", "create-project.ts"),
  path.join("scripts", "self-test.ts"),
  path.join("templates", "project"),
  "INSTALL.es.md",
  "MANIFEST.md",
  "PROJECT.template.md",
];

// Release-readiness handoff documents (PI_*.md) are source-only working
// artifacts and must never leak into derived applications.
const DERIVED_SOURCE_ONLY_FILE_PATTERN = /^PI_.*\.md$/;

const DERIVED_SOURCE_ONLY_SCRIPTS = ["generate:project", "phase1:self-test"];

async function removeDerivedProjectMapCapability(destination: string): Promise<void> {
  const projectMapPath = path.join(destination, "docs", "ai", "project-map.yaml");
  if (!(await pathExists(projectMapPath))) {
    return;
  }

  const content = await readFile(projectMapPath, "utf8");
  const filtered = content
    .split("\n")
    .filter((line) => !/^\s*generateProject:/.test(line))
    .join("\n");

  if (filtered !== content) {
    await writeFile(projectMapPath, filtered, "utf8");
  }
}

async function applyDerivedProjectCleanup(destination: string): Promise<void> {
  for (const relative of DERIVED_SOURCE_ONLY_FILES) {
    await rm(path.join(destination, relative), { recursive: true, force: true });
  }

  const { readdir } = await import("node:fs/promises");
  for (const entry of await readdir(destination)) {
    if (DERIVED_SOURCE_ONLY_FILE_PATTERN.test(entry)) {
      await rm(path.join(destination, entry), { recursive: true, force: true });
    }
  }

  // Source-only package.json scripts are dropped by updatePackageIdentity with
  // format-preserving text edits; no JSON round-trip happens here.
  await removeDerivedProjectMapCapability(destination);
}

function runCommand(command: string, args: string[], cwd: string, label: string): void {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`${label} failed with status ${result.status ?? "unknown"}.`);
  }
}

interface NpmInstallResult {
  status: number | null;
  output: string;
}

/**
 * Run npm install streaming output live while buffering it for failure
 * analysis. Returns the exit status with the combined output.
 */
function spawnNpmInstall(destination: string, extraEnv?: NodeJS.ProcessEnv): Promise<NpmInstallResult> {
  return new Promise((resolve, reject) => {
    // npm exposes its resolved config as npm_config_* vars to scripts. When
    // this generator runs via `npm run`, the outer allow-scripts value leaks
    // in as npm_config_allow_scripts and npm 12 misclassifies it as a CLI
    // flag, refusing every project install. Strip that leaked artifact so the
    // inner install behaves as if invoked directly; file-based config still
    // applies normally. All other npm_config_* entries (registry, auth) are
    // preserved.
    const childEnv: NodeJS.ProcessEnv = { ...process.env, ...extraEnv };
    delete childEnv.npm_config_allow_scripts;
    const child = spawn("npm", ["install"], {
      cwd: destination,
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      process.stdout.write(chunk);
      output += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      process.stderr.write(chunk);
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (status) => {
      resolve({ status, output });
    });
  });
}

export function isNpmLifecyclePolicyFailure(output: string): boolean {
  return /EALLOWSCRIPTS|allow-scripts/i.test(output);
}

async function neutralNpmUserConfig(): Promise<string> {
  const configPath = path.join(os.tmpdir(), "studio-admin-empty-npmrc");
  await writeFile(configPath, "", "utf8");
  return configPath;
}

async function runNpmInstall(destination: string): Promise<void> {
  const first = await spawnNpmInstall(destination);

  if (first.status === 0) {
    return;
  }

  if (!isNpmLifecyclePolicyFailure(first.output)) {
    throw new Error(
      `npm install failed with status ${first.status ?? "unknown"}.\n\n` +
        `The derived project at ${destination} is incomplete (dependencies were not installed).\n` +
        `Fix the reported npm error and retry with --force to replace the partial destination.`,
    );
  }

  console.log(
    "Global npm config restricts lifecycle scripts (allow-scripts) and npm refused the install." +
      " Retrying once with a neutral npm config for this install only.",
  );

  const second = await spawnNpmInstall(destination, {
    npm_config_userconfig: await neutralNpmUserConfig(),
  });

  if (second.status === 0) {
    return;
  }

  throw new Error(
    `npm install failed with status ${second.status ?? "unknown"} even with a neutral npm config.\n\n` +
      `The derived project at ${destination} is incomplete (dependencies were not installed).\n` +
      `Fix the reported npm error and retry with --force to replace the partial destination.`,
  );
}

export async function createProject(options: CreateProjectOptions): Promise<string> {
  const {
    repositoryRoot,
    profile = "full",
    force = false,
    initializeGit = false,
    installDependencies = false,
  } = options;

  await ensureRepositoryRoot(repositoryRoot);

  const packageName = assertKebabCase(options.name, "project name");
  const destination = path.resolve(options.destination ?? path.join(repositoryRoot, "..", packageName));

  if (destination === repositoryRoot || destination.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new Error("The derived project destination must be outside the boilerplate root.");
  }

  if (await pathExists(destination)) {
    if (!force) {
      throw new Error(`Destination already exists: ${destination}. Use --force only when replacement is intended.`);
    }
    await rm(destination, { recursive: true, force: true });
  }

  await copyRepository(repositoryRoot, destination);

  const { sourceVersion } = await updatePackageIdentity(destination, packageName);
  const commit = sourceCommit(repositoryRoot);
  const title = options.title ?? titleCase(packageName);
  const description = options.description ?? "Complete the product purpose before implementing features.";

  await writeProjectContract({
    destination,
    title,
    description,
    sourceVersion,
    sourceCommit: commit,
  });

  await writeJson(path.join(destination, ".boilerplate.json"), {
    schemaVersion: 1,
    template: "studio-admin",
    sourceVersion,
    sourceCommit: commit,
    profile,
    createdFrom: path.basename(repositoryRoot),
  });

  if (profile === "minimal") {
    await applyMinimalProfile(destination);
  }

  if (installDependencies) {
    await runNpmInstall(destination);
  }

  if (profile === "minimal") {
    await regenerateMinimalRouteTree(repositoryRoot, destination);
  }

  await applyDerivedProjectCleanup(destination);

  await generateAiContext({ repositoryRoot: destination });

  if (initializeGit) {
    await rm(path.join(destination, ".git"), { recursive: true, force: true });
    runCommand("git", ["init"], destination, "git init");
  }

  return destination;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.flags.has("help") || args.positionals.length === 0) {
    printUsage([
      "Create a derived project by copying the prepared boilerplate.",
      "",
      "Usage:",
      "  npm run generate:project -- <kebab-name> [options]",
      "",
      "Options:",
      "  --destination <path>",
      "  --title <text>",
      "  --description <text>",
      "  --profile <full|minimal>",
      "  --install (recommended with --profile minimal: installs destination",
      "    dependencies first so the TanStack Router CLI can regenerate the route tree)",
      "  --git-init",
      "  --force",
      "",
      "The derived project keeps feature, dashboard, CRUD, validator, and AI context",
      "tooling, but never generate:project. A minimal project without a resolvable",
      "TanStack Router CLI fails instead of shipping a stale src/routeTree.gen.ts.",
    ]);
    return;
  }

  const profileValue = stringFlag(args, "profile", "full");
  if (profileValue !== "full" && profileValue !== "minimal") {
    throw new Error(`Unsupported profile: ${profileValue}. Use full or minimal.`);
  }

  const destination = await createProject({
    repositoryRoot: process.cwd(),
    name: args.positionals[0],
    destination: stringFlag(args, "destination"),
    title: stringFlag(args, "title"),
    description: stringFlag(args, "description"),
    profile: profileValue,
    force: booleanFlag(args, "force"),
    initializeGit: booleanFlag(args, "git-init"),
    installDependencies: booleanFlag(args, "install"),
  });

  console.log(`Created derived project: ${destination}`);
  console.log("Next: complete PROJECT.md, install dependencies if needed, and run npm run validate.");
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
