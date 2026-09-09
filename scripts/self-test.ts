import { pathExists, readJson } from "./_lib/files.js";
import { createCrud } from "./create-crud.js";
import { createDashboard } from "./create-dashboard.js";
import { createFeature } from "./create-feature.js";
import { createProject } from "./create-project.js";
import { generateAiContext } from "./generate-ai-context.js";
import { validateArchitecture } from "./validate-architecture.js";
import { validateNavigation } from "./validate-navigation.js";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function fixtureWrite(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

async function writeFixture(repositoryRoot: string, fixtureRoot: string): Promise<void> {
  await cp(path.join(repositoryRoot, "templates"), path.join(fixtureRoot, "templates"), {
    recursive: true,
  });
  await cp(path.join(repositoryRoot, "docs"), path.join(fixtureRoot, "docs"), {
    recursive: true,
  });
  await cp(path.join(repositoryRoot, "scripts"), path.join(fixtureRoot, "scripts"), {
    recursive: true,
  });

  await fixtureWrite(
    path.join(fixtureRoot, "package.json"),
    `${JSON.stringify(
      {
        name: "phase1-fixture",
        version: "1.0.0",
        private: true,
        scripts: {},
        dependencies: {
          "@tanstack/react-start": "^1.168.50",
          "@tanstack/react-router": "^1.167.1",
          react: "^19.2.8",
          zod: "^4.4.3",
          "react-hook-form": "^7.82.0",
          "@tanstack/react-table": "^8.21.3",
          zustand: "^5.0.14",
          vite: "^8.2.2",
          nitro: "^3.0.260610-beta",
        },
        devDependencies: {
          typescript: "^5.9.3",
          "ts-node": "^10.9.2",
          "@biomejs/biome": "^2.5.5",
          tailwindcss: "^4.1.5",
        },
      },
      null,
      2,
    )}\n`,
  );

  await fixtureWrite(
    path.join(fixtureRoot, "components.json"),
    `${JSON.stringify(
      {
        style: "base-nova",
        rsc: false,
        iconLibrary: "lucide",
        aliases: {
          components: "@/components",
          utils: "@/lib/utils",
          ui: "@/components/ui",
          lib: "@/lib",
          hooks: "@/hooks",
        },
      },
      null,
      2,
    )}\n`,
  );

  await fixtureWrite(path.join(fixtureRoot, "PROJECT.md"), "# Fixture\n\nConfigured project contract.\n");

  const defaultRoute = path.join(fixtureRoot, "src", "routes", "(main)", "dashboard", "default");
  await cp(path.join(repositoryRoot, "templates", "feature"), path.join(fixtureRoot, ".fixture-template-copy"), {
    recursive: true,
  });
  await rm(path.join(fixtureRoot, ".fixture-template-copy"), { recursive: true, force: true });

  await fixtureWrite(
    path.join(defaultRoute, "route.tsx"),
    [
      'import { createFileRoute } from "@tanstack/react-router";',
      "",
      'export const Route = createFileRoute("/(main)/dashboard/default")({',
      "  component: Page,",
      "});",
      "",
      "function Page() {",
      "  return <main>Default</main>;",
      "}",
      "",
    ].join("\n"),
  );

  const uiRoot = path.join(fixtureRoot, "src", "components", "ui");
  for (const name of ["button", "card", "input", "skeleton", "table"]) {
    await fixtureWrite(path.join(uiRoot, `${name}.tsx`), `export const ${name} = "${name}";\n`);
  }

  await fixtureWrite(
    path.join(fixtureRoot, "src", "navigation", "sidebar", "sidebar-items.ts"),
    `import {
  LayoutDashboard,
  SquareArrowUpRight,
  type LucideIcon,
  Users,
} from "lucide-react";

export type NavBadge = "new" | "soon";
export type AppPath = string;
export interface NavSubItem {
  id: string;
  title: string;
  url: AppPath;
  icon?: LucideIcon;
}
interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
}
export interface NavMainLinkItem extends NavItemBase {
  url: AppPath;
  subItems?: never;
}
export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}
export type NavMainItem = NavMainLinkItem | NavMainParentItem;
export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      {
        id: "default",
        title: "Default",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Pages",
    items: [],
  },
];
`,
  );
}

async function assertPath(targetPath: string): Promise<void> {
  if (!(await pathExists(targetPath))) {
    throw new Error(`Expected generated path: ${targetPath}`);
  }
}

async function main(): Promise<void> {
  const repositoryRoot = process.cwd();
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "studio-admin-phase1-"));
  const fixtureRoot = path.join(temporaryRoot, "boilerplate");
  const derivedRoot = path.join(temporaryRoot, "derived-project");

  try {
    await writeFixture(repositoryRoot, fixtureRoot);

    await createFeature({
      repositoryRoot: fixtureRoot,
      name: "reports",
      navigation: true,
      refreshContext: false,
    });
    await createDashboard({
      repositoryRoot: fixtureRoot,
      name: "operations",
      refreshContext: false,
    });
    await createCrud({
      repositoryRoot: fixtureRoot,
      routeName: "customers",
      refreshContext: false,
    });

    await assertPath(path.join(fixtureRoot, "src", "routes", "(main)", "dashboard", "reports", "route.tsx"));
    await assertPath(
      path.join(
        fixtureRoot,
        "src",
        "routes",
        "(main)",
        "dashboard",
        "operations",
        "-components",
        "operations-kpis.tsx",
      ),
    );
    await assertPath(path.join(fixtureRoot, "src", "routes", "(main)", "dashboard", "customers", "$id.tsx"));

    await generateAiContext({ repositoryRoot: fixtureRoot });

    const architecture = await validateArchitecture(fixtureRoot);
    if (architecture.errorCount > 0) {
      throw new Error(
        `Architecture self-test produced ${architecture.errorCount} errors:\n${JSON.stringify(
          architecture.findings,
          null,
          2,
        )}`,
      );
    }

    const navigation = await validateNavigation(fixtureRoot);
    if (navigation.errors.length > 0) {
      throw new Error(`Navigation self-test failed:\n${navigation.errors.join("\n")}`);
    }

    await createProject({
      repositoryRoot: fixtureRoot,
      name: "derived-project",
      destination: derivedRoot,
      profile: "full",
    });

    const derivedPackage = await readJson<{ name: string; version: string }>(path.join(derivedRoot, "package.json"));

    if (derivedPackage.name !== "derived-project" || derivedPackage.version !== "0.1.0") {
      throw new Error("Derived project package identity was not updated correctly.");
    }

    const context = await readFile(path.join(fixtureRoot, "docs", "ai", "generated-context.md"), "utf8");

    if (!context.includes("/dashboard/customers") || !context.includes("reports")) {
      throw new Error("Generated AI context did not include generated routes.");
    }

    console.log("Phase 1 self-test passed.");
    console.log("- Feature generator: passed");
    console.log("- Dashboard generator: passed");
    console.log("- CRUD generator: passed");
    console.log("- Project generator: passed");
    console.log("- AI context generation: passed");
    console.log("- Architecture validation: passed");
    console.log("- Navigation validation: passed");
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
