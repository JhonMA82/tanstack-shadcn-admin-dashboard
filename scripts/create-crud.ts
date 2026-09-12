import { booleanFlag, parseArgs, printUsage, stringFlag } from "./_lib/cli.js";
import { ensureRepositoryRoot } from "./_lib/files.js";
import { assertKebabCase, camelCase, pascalCase, pluralize, singularize, titleCase } from "./_lib/naming.js";
import { addNavigationItem } from "./_lib/navigation.js";
import { regenerateRouteTree } from "./_lib/routes.js";
import { jsxText, renderTemplateTree } from "./_lib/templates.js";
import { generateAiContext } from "./generate-ai-context.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface CreateCrudOptions {
  repositoryRoot: string;
  routeName: string;
  singularName?: string;
  description?: string;
  navigation?: boolean;
  navigationGroup?: string;
  navigationIcon?: string;
  navigationTitle?: string;
  force?: boolean;
  refreshContext?: boolean;
}

export async function createCrud(options: CreateCrudOptions): Promise<string[]> {
  const {
    repositoryRoot,
    description = "Replace mock data and placeholder submission with approved server boundaries.",
    navigation = true,
    navigationGroup = "Pages",
    navigationIcon = "Users",
    navigationTitle,
    force = false,
    refreshContext = true,
  } = options;

  await ensureRepositoryRoot(repositoryRoot);

  const pluralRoute = assertKebabCase(options.routeName, "CRUD route name");
  const singular = assertKebabCase(options.singularName ?? singularize(pluralRoute), "singular entity name");
  const normalizedPlural = pluralize(singular);

  if (pluralRoute !== normalizedPlural) {
    console.warn(
      `Route "${pluralRoute}" does not match the inferred plural "${normalizedPlural}". ` +
        "The supplied route is preserved.",
    );
  }

  const destination = path.join(repositoryRoot, "src", "routes", "(main)", "dashboard", pluralRoute);

  const written = await renderTemplateTree({
    templateDirectory: path.join(repositoryRoot, "templates", "crud"),
    destinationDirectory: destination,
    tokens: {
      ROUTE_NAME: pluralRoute,
      ENTITY_SINGULAR: singular,
      ENTITY_PLURAL: pluralRoute,
      CAMEL_SINGULAR: camelCase(singular),
      CAMEL_PLURAL: camelCase(pluralRoute),
      PASCAL_SINGULAR: pascalCase(singular),
      PASCAL_PLURAL: pascalCase(pluralRoute),
      TITLE_SINGULAR: titleCase(singular),
      TITLE_PLURAL: titleCase(pluralRoute),
      // Free-text description lands in JSX text: entity-escape braces
      // and angle brackets so it cannot break the generated TSX.
      DESCRIPTION: jsxText(description),
    },
    force,
  });

  if (navigation) {
    await addNavigationItem(repositoryRoot, {
      id: pluralRoute,
      title: navigationTitle ?? titleCase(pluralRoute),
      url: `/dashboard/${pluralRoute}`,
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
      "Create a compile-oriented CRUD route scaffold.",
      "",
      "Usage:",
      "  npm run generate:crud -- <plural-kebab-route> [options]",
      "",
      "Options:",
      "  --singular <kebab-name>",
      "  --description <text>",
      "  --no-nav",
      "  --nav-group <Pages|Dashboards>",
      "  --nav-icon <LucideExport>",
      "  --nav-title <text>",
      "  --force",
      "  --no-context",
    ]);
    return;
  }

  const repositoryRoot = process.cwd();
  const written = await createCrud({
    repositoryRoot,
    routeName: args.positionals[0],
    singularName: stringFlag(args, "singular"),
    description: stringFlag(args, "description"),
    navigation: booleanFlag(args, "nav", true),
    navigationGroup: stringFlag(args, "nav-group", "Pages"),
    navigationIcon: stringFlag(args, "nav-icon", "Users"),
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
