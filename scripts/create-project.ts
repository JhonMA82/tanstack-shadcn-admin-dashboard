import { booleanFlag, parseArgs, printUsage, stringFlag } from "./_lib/cli.js";
import { ensureRepositoryRoot, pathExists, readJson, writeJson } from "./_lib/files.js";
import { assertKebabCase, titleCase } from "./_lib/naming.js";
import { renderTemplate } from "./_lib/templates.js";
import { generateAiContext } from "./generate-ai-context.js";
import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
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

const COPY_EXCLUSIONS = new Set([".git", ".next", "node_modules", "coverage", "dist", ".turbo", ".DS_Store"]);

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

async function updatePackageIdentity(destination: string, packageName: string): Promise<{ sourceVersion: string }> {
  const packagePath = path.join(destination, "package.json");
  const packageJson = await readJson<PackageJson>(packagePath);
  const sourceVersion = packageJson.version ?? "unknown";

  packageJson.name = packageName;
  packageJson.version = "0.1.0";
  packageJson.private = true;
  await writeJson(packagePath, packageJson);

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

async function applyMinimalProfile(destination: string): Promise<void> {
  const configPath = path.join(destination, "templates", "project", "minimal-profile.json");
  const config = await readJson<{ removeDashboardDirectories: string[] }>(configPath);
  const dashboardRoot = path.join(destination, "src", "routes", "(main)", "dashboard");

  for (const directory of config.removeDashboardDirectories) {
    await rm(path.join(dashboardRoot, directory), { recursive: true, force: true });
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

function runCommand(command: string, args: string[], cwd: string, label: string): void {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`${label} failed with status ${result.status ?? "unknown"}.`);
  }
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

  await generateAiContext({ repositoryRoot: destination });

  if (installDependencies) {
    runCommand("npm", ["install"], destination, "npm install");
  }

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
      "  --install",
      "  --git-init",
      "  --force",
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
