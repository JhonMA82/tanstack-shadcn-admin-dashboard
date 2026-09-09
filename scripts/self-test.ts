import { pathExists, readJson } from "./_lib/files.js";
import { resolveTsrBinary } from "./_lib/routes.js";
import { createCrud } from "./create-crud.js";
import { createDashboard } from "./create-dashboard.js";
import { createFeature } from "./create-feature.js";
import { createProject, isNpmLifecyclePolicyFailure } from "./create-project.js";
import { generateAiContext } from "./generate-ai-context.js";
import { validateArchitecture } from "./validate-architecture.js";
import { validateNavigation } from "./validate-navigation.js";
import { chmod, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
        scripts: {
          "generate:project": "bun scripts/create-project.ts",
          "generate:feature": "bun scripts/create-feature.ts",
          "generate:dashboard": "bun scripts/create-dashboard.ts",
          "generate:crud": "bun scripts/create-crud.ts",
          "generate-routes": "tsr generate",
          "ai:context": "bun scripts/generate-ai-context.ts",
          "ai:context:check": "bun scripts/generate-ai-context.ts --check",
          "validate:architecture": "bun scripts/validate-architecture.ts",
          "validate:navigation": "bun scripts/validate-navigation.ts",
          validate: "npm run check",
          "phase1:self-test": "bun scripts/self-test.ts",
        },
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

async function assertMissing(targetPath: string): Promise<void> {
  if (await pathExists(targetPath)) {
    throw new Error(`Expected path to be removed: ${targetPath}`);
  }
}

async function seedMinimalFixture(fixtureRoot: string, options: { withTsr?: boolean } = {}): Promise<void> {
  const { withTsr = true } = options;
  const stubRoute = (routeId: string): string =>
    [
      'import { createFileRoute } from "@tanstack/react-router";',
      "",
      `export const Route = createFileRoute("${routeId}")({`,
      "  component: Page,",
      "});",
      "",
      "function Page() {",
      "  return <main>Stub</main>;",
      "}",
      "",
    ].join("\n");

  await fixtureWrite(
    path.join(fixtureRoot, "src", "routes", "(main)", "dashboard", "crm", "route.tsx"),
    stubRoute("/(main)/dashboard/crm"),
  );
  await fixtureWrite(path.join(fixtureRoot, "src", "routes", "(main)", "chat", "route.tsx"), stubRoute("/(main)/chat"));
  await fixtureWrite(path.join(fixtureRoot, "src", "routes", "(main)", "mail", "route.tsx"), stubRoute("/(main)/mail"));
  await fixtureWrite(
    path.join(fixtureRoot, "src", "routeTree.gen.ts"),
    "// stale fixture route tree\n// references /(main)/dashboard/crm /(main)/chat /(main)/mail\n",
  );

  const tsrPath = path.join(fixtureRoot, "node_modules", ".bin", "tsr");
  if (withTsr) {
    await fixtureWrite(tsrPath, ["#!/bin/sh", 'printf \'%s\\n\' "$@" > "$PWD/tsr-invocation.log"', ""].join("\n"));
    await chmod(tsrPath, 0o755);
  } else {
    await rm(tsrPath, { recursive: true, force: true });
  }
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
    await createCrud({
      repositoryRoot: fixtureRoot,
      routeName: "inventory-items",
      singularName: "inventory-item",
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
    await assertPath(path.join(fixtureRoot, "src", "routes", "(main)", "dashboard", "inventory-items", "$id.tsx"));

    const inventoryIndex = await readFile(
      path.join(fixtureRoot, "src", "routes", "(main)", "dashboard", "inventory-items", "route.tsx"),
      "utf8",
    );
    if (!inventoryIndex.includes("inventory-item") || !inventoryIndex.includes("inventory-items")) {
      throw new Error("CRUD with explicit singular did not use inventory-item / inventory-items correctly.");
    }

    const fixtureSidebar = await readFile(
      path.join(fixtureRoot, "src", "navigation", "sidebar", "sidebar-items.ts"),
      "utf8",
    );
    if (!fixtureSidebar.includes("/dashboard/reports")) {
      throw new Error("Feature with --nav did not register a navigation entry for reports.");
    }

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

    const derivedPackage = await readJson<{ name: string; version: string; scripts?: Record<string, string> }>(
      path.join(derivedRoot, "package.json"),
    );

    if (derivedPackage.name !== "derived-project" || derivedPackage.version !== "0.1.0") {
      throw new Error("Derived project package identity was not updated correctly.");
    }

    for (const script of [
      "generate:feature",
      "generate:dashboard",
      "generate:crud",
      "ai:context",
      "validate:architecture",
      "validate:navigation",
    ]) {
      if (!derivedPackage.scripts?.[script]) {
        throw new Error(`Derived project lost required scaffolding script: ${script}.`);
      }
    }

    for (const script of ["generate:project", "phase1:self-test"]) {
      if (derivedPackage.scripts?.[script]) {
        throw new Error(`Derived project must not keep source-only script: ${script}.`);
      }
    }

    for (const sourceOnly of [
      path.join(derivedRoot, "scripts", "create-project.ts"),
      path.join(derivedRoot, "scripts", "self-test.ts"),
      path.join(derivedRoot, "templates", "project"),
    ]) {
      await assertMissing(sourceOnly);
    }

    await assertPath(path.join(derivedRoot, "templates", "feature"));
    await assertPath(path.join(derivedRoot, "templates", "dashboard"));
    await assertPath(path.join(derivedRoot, "templates", "crud"));
    await assertPath(path.join(derivedRoot, "scripts", "_lib"));

    const derivedProjectMap = await readFile(path.join(derivedRoot, "docs", "ai", "project-map.yaml"), "utf8");
    if (/^\s*generateProject:/m.test(derivedProjectMap)) {
      throw new Error("Derived project-map.yaml still advertises the removed generateProject capability.");
    }

    await createFeature({
      repositoryRoot: derivedRoot,
      name: "reports",
      navigation: true,
      force: true,
      refreshContext: false,
    });
    await createDashboard({
      repositoryRoot: derivedRoot,
      name: "operations",
      force: true,
      refreshContext: false,
    });
    await createCrud({
      repositoryRoot: derivedRoot,
      routeName: "inventory-items",
      singularName: "inventory-item",
      force: true,
      refreshContext: false,
    });

    await assertPath(path.join(derivedRoot, "src", "routes", "(main)", "dashboard", "reports", "route.tsx"));
    await assertPath(
      path.join(
        derivedRoot,
        "src",
        "routes",
        "(main)",
        "dashboard",
        "operations",
        "-components",
        "operations-kpis.tsx",
      ),
    );
    await assertPath(path.join(derivedRoot, "src", "routes", "(main)", "dashboard", "inventory-items", "$id.tsx"));

    const context = await readFile(path.join(fixtureRoot, "docs", "ai", "generated-context.md"), "utf8");

    if (!context.includes("/dashboard/customers") || !context.includes("reports")) {
      throw new Error("Generated AI context did not include generated routes.");
    }

    const minimalRoot = path.join(temporaryRoot, "derived-minimal");
    await seedMinimalFixture(fixtureRoot);
    await createProject({
      repositoryRoot: fixtureRoot,
      name: "derived-minimal",
      destination: minimalRoot,
      profile: "minimal",
    });

    await assertMissing(path.join(minimalRoot, "src", "routes", "(main)", "dashboard", "crm"));
    await assertMissing(path.join(minimalRoot, "src", "routes", "(main)", "chat"));
    await assertMissing(path.join(minimalRoot, "src", "routes", "(main)", "mail"));
    await assertPath(path.join(minimalRoot, "src", "routes", "(main)", "dashboard", "default", "route.tsx"));
    await assertPath(path.join(minimalRoot, "src", "routes", "(main)", "dashboard", "reports", "route.tsx"));

    const minimalSidebar = await readFile(
      path.join(minimalRoot, "src", "navigation", "sidebar", "sidebar-items.ts"),
      "utf8",
    );
    if (!minimalSidebar.includes("/dashboard/default") || minimalSidebar.includes("Pages")) {
      throw new Error("Minimal profile did not reset the sidebar to the canonical dashboard.");
    }

    const minimalCanonical = await readFile(path.join(minimalRoot, "docs", "ai", "canonical-examples.yaml"), "utf8");
    if (!minimalCanonical.includes("default-dashboard")) {
      throw new Error("Minimal profile did not reset the canonical examples.");
    }

    await assertPath(path.join(minimalRoot, "tsr-invocation.log"));
    const tsrInvocation = await readFile(path.join(minimalRoot, "tsr-invocation.log"), "utf8");
    if (!tsrInvocation.includes("generate")) {
      throw new Error("Minimal profile did not regenerate the route tree.");
    }

    const noCliSource = path.join(temporaryRoot, "boilerplate-no-cli");
    await writeFixture(repositoryRoot, noCliSource);
    await seedMinimalFixture(noCliSource, { withTsr: false });

    const destinationCliSource = path.join(temporaryRoot, "boilerplate-destination-cli");
    await writeFixture(repositoryRoot, destinationCliSource);
    await seedMinimalFixture(destinationCliSource, { withTsr: true });
    const destinationCliProbe = path.join(temporaryRoot, "destination-cli-probe");
    await mkdir(path.join(destinationCliProbe, "node_modules", ".bin"), { recursive: true });
    const destinationTsr = path.join(destinationCliProbe, "node_modules", ".bin", "tsr");
    await fixtureWrite(destinationTsr, "#!/bin/sh\n");
    const preferredTsr = await resolveTsrBinary(destinationCliSource, destinationCliProbe);
    if (preferredTsr !== destinationTsr) {
      throw new Error("TanStack Router CLI resolution must prefer the destination installation over the source.");
    }
    const fallbackTsr = await resolveTsrBinary(destinationCliSource, path.join(temporaryRoot, "destination-cli-empty"));
    if (fallbackTsr !== path.join(destinationCliSource, "node_modules", ".bin", "tsr")) {
      throw new Error("TanStack Router CLI resolution must fall back to the boilerplate source installation.");
    }
    if ((await resolveTsrBinary(noCliSource, path.join(temporaryRoot, "destination-cli-empty"))) !== null) {
      throw new Error("TanStack Router CLI resolution must be null when neither installation exists.");
    }
    if (!isNpmLifecyclePolicyFailure("npm error code EALLOWSCRIPTS\nnpm error --allow-scripts is not allowed")) {
      throw new Error("npm lifecycle policy failures must be detected from install output.");
    }
    if (isNpmLifecyclePolicyFailure("npm error code ENETUNREACH\nrequest to registry failed")) {
      throw new Error("Unrelated npm failures must not be mistaken for lifecycle policy blocks.");
    }
    let minimalWithoutCliFailed = false;
    try {
      await createProject({
        repositoryRoot: noCliSource,
        name: "derived-no-cli",
        destination: path.join(temporaryRoot, "derived-no-cli"),
        profile: "minimal",
      });
    } catch {
      minimalWithoutCliFailed = true;
    }
    if (!minimalWithoutCliFailed) {
      throw new Error(
        "Minimal profile without a TanStack Router CLI must fail instead of shipping a stale route tree.",
      );
    }

    const minimalNavigation = await validateNavigation(minimalRoot);
    if (minimalNavigation.errors.length > 0) {
      throw new Error(`Minimal navigation self-test failed:\n${minimalNavigation.errors.join("\n")}`);
    }

    const minimalArchitecture = await validateArchitecture(minimalRoot);
    if (minimalArchitecture.errorCount > 0) {
      throw new Error(
        `Minimal architecture self-test produced ${minimalArchitecture.errorCount} errors:\n${JSON.stringify(
          minimalArchitecture.findings,
          null,
          2,
        )}`,
      );
    }

    await createFeature({
      repositoryRoot: minimalRoot,
      name: "reports",
      navigation: true,
      force: true,
      refreshContext: false,
    });
    const minimalReportsSidebar = await readFile(
      path.join(minimalRoot, "src", "navigation", "sidebar", "sidebar-items.ts"),
      "utf8",
    );
    if (!minimalReportsSidebar.includes('label: "Pages"')) {
      throw new Error("Feature with --nav did not create the missing Pages group on a minimal sidebar.");
    }
    if (!minimalReportsSidebar.includes("/dashboard/reports")) {
      throw new Error("Feature with --nav did not register reports on a minimal sidebar.");
    }
    const minimalReportsNavigation = await validateNavigation(minimalRoot);
    if (minimalReportsNavigation.errors.length > 0) {
      throw new Error(`Minimal reports navigation self-test failed:\n${minimalReportsNavigation.errors.join("\n")}`);
    }

    console.log("Phase 1 self-test passed.");
    console.log("- Feature generator: passed");
    console.log("- Feature generator with --nav: passed");
    console.log("- Dashboard generator: passed");
    console.log("- CRUD generator: passed");
    console.log("- CRUD generator with --singular: passed");
    console.log("- Project generator: passed");
    console.log("- Derived scaffolding contract: passed");
    console.log("- Minimal route tree (source CLI): passed");
    console.log("- Minimal route tree (destination CLI): passed");
    console.log("- Minimal without CLI fails explicitly: passed");
    console.log("- Feature --nav creates missing group: passed");
    console.log("- npm policy failure detection: passed");
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
