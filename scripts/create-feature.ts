import { booleanFlag, parseArgs, printUsage, stringFlag } from "./_lib/cli.js";
import { ensureRepositoryRoot } from "./_lib/files.js";
import { assertKebabCase, pascalCase, titleCase } from "./_lib/naming.js";
import { addNavigationItem } from "./_lib/navigation.js";
import { regenerateRouteTree } from "./_lib/routes.js";
import { renderTemplateTree } from "./_lib/templates.js";
import { generateAiContext } from "./generate-ai-context.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface CreateFeatureOptions {
  repositoryRoot: string;
  name: string;
  description?: string;
  navigation?: boolean;
  navigationGroup?: string;
  navigationIcon?: string;
  navigationTitle?: string;
  force?: boolean;
  refreshContext?: boolean;
}

export async function createFeature(options: CreateFeatureOptions): Promise<string[]> {
  const {
    repositoryRoot,
    description = "Implement the approved product behavior for this feature.",
    navigation = false,
    navigationGroup = "Pages",
    navigationIcon = "SquareArrowUpRight",
    navigationTitle,
    force = false,
    refreshContext = true,
  } = options;

  await ensureRepositoryRoot(repositoryRoot);

  const routeName = assertKebabCase(options.name, "feature name");
  const destination = path.join(repositoryRoot, "src", "routes", "(main)", "dashboard", routeName);

  const written = await renderTemplateTree({
    templateDirectory: path.join(repositoryRoot, "templates", "feature"),
    destinationDirectory: destination,
    tokens: {
      ROUTE_NAME: routeName,
      PASCAL_NAME: pascalCase(routeName),
      TITLE_NAME: titleCase(routeName),
      DESCRIPTION: description,
    },
    force,
  });

  if (navigation) {
    await addNavigationItem(repositoryRoot, {
      id: routeName,
      title: navigationTitle ?? titleCase(routeName),
      url: `/dashboard/${routeName}`,
      icon: navigationIcon,
      group: navigationGroup,
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
      "Create a route-colocated dashboard feature.",
      "",
      "Usage:",
      "  npm run generate:feature -- <kebab-name> [options]",
      "",
      "Options:",
      "  --description <text>",
      "  --nav",
      "  --nav-group <Pages|Dashboards>",
      "  --nav-icon <LucideExport>",
      "  --nav-title <text>",
      "  --force",
      "  --no-context",
    ]);
    return;
  }

  const repositoryRoot = process.cwd();
  const written = await createFeature({
    repositoryRoot,
    name: args.positionals[0],
    description: stringFlag(args, "description"),
    navigation: booleanFlag(args, "nav"),
    navigationGroup: stringFlag(args, "nav-group", "Pages"),
    navigationIcon: stringFlag(args, "nav-icon", "SquareArrowUpRight"),
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
