import { booleanFlag, parseArgs, printUsage, stringFlag } from "./_lib/cli.js";
import { ensureRepositoryRoot } from "./_lib/files.js";
import { assertKebabCase, pascalCase, titleCase } from "./_lib/naming.js";
import { addNavigationItem } from "./_lib/navigation.js";
import { regenerateRouteTree } from "./_lib/routes.js";
import { jsxText, renderTemplateTree } from "./_lib/templates.js";
import { generateAiContext } from "./generate-ai-context.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface CreateDashboardOptions {
  repositoryRoot: string;
  name: string;
  description?: string;
  navigation?: boolean;
  navigationIcon?: string;
  navigationTitle?: string;
  force?: boolean;
  refreshContext?: boolean;
}

export async function createDashboard(options: CreateDashboardOptions): Promise<string[]> {
  const {
    repositoryRoot,
    description = "Replace placeholder metrics with approved server data.",
    navigation = true,
    navigationIcon = "LayoutDashboard",
    navigationTitle,
    force = false,
    refreshContext = true,
  } = options;

  await ensureRepositoryRoot(repositoryRoot);
  const routeName = assertKebabCase(options.name, "dashboard name");

  const destination = path.join(repositoryRoot, "src", "routes", "(main)", "dashboard", routeName);

  const written = await renderTemplateTree({
    templateDirectory: path.join(repositoryRoot, "templates", "dashboard"),
    destinationDirectory: destination,
    tokens: {
      ROUTE_NAME: routeName,
      PASCAL_NAME: pascalCase(routeName),
      TITLE_NAME: titleCase(routeName),
      // Free-text description lands in JSX text: entity-escape braces
      // and angle brackets so it cannot break the generated TSX.
      DESCRIPTION: jsxText(description),
    },
    force,
  });

  if (navigation) {
    await addNavigationItem(repositoryRoot, {
      id: routeName,
      title: navigationTitle ?? titleCase(routeName),
      url: `/dashboard/${routeName}`,
      icon: navigationIcon,
      group: "Dashboards",
    });
  }

  await regenerateRouteTree(repositoryRoot);

  if (refreshContext) {
    await generateAiContext({ repositoryRoot });
  }

  return written;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.flags.has("help") || args.positionals.length === 0) {
    printUsage([
      "Create a dashboard overview scaffold.",
      "",
      "Usage:",
      "  npm run generate:dashboard -- <kebab-name> [options]",
      "",
      "Options:",
      "  --description <text>",
      "  --no-nav",
      "  --nav-icon <LucideExport>",
      "  --nav-title <text>",
      "  --force",
      "  --no-context",
    ]);
    return;
  }

  const repositoryRoot = process.cwd();
  const written = await createDashboard({
    repositoryRoot,
    name: args.positionals[0],
    description: stringFlag(args, "description"),
    navigation: booleanFlag(args, "nav", true),
    navigationIcon: stringFlag(args, "nav-icon", "LayoutDashboard"),
    navigationTitle: stringFlag(args, "nav-title"),
    force: booleanFlag(args, "force"),
    refreshContext: booleanFlag(args, "context", true),
  });

  console.log(`Created ${written.length} files:`);
  for (const file of written) {
    console.log(`- ${path.relative(repositoryRoot, file)}`);
  }
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
