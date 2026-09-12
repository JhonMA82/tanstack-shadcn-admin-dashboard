import { createProject, isNpmLifecyclePolicyFailure } from "./create-project.js";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ProjectProfile = "full" | "minimal";

/**
 * Run an npm script inside a derived project, streaming nothing on success
 * and reporting captured output on failure. A global lifecycle-script policy
 * (allow-scripts) gets one retry with a neutral npm config, mirroring the
 * install path in create-project.ts.
 */
async function npmRun(destination: string, script: string, args: string[] = []): Promise<void> {
  const attempt = (extraEnv?: NodeJS.ProcessEnv): { status: number | null; output: string } => {
    const childEnv: NodeJS.ProcessEnv = { ...process.env, ...extraEnv };
    delete childEnv.npm_config_allow_scripts;
    const result = spawnSync("npm", ["run", script, ...args], {
      cwd: destination,
      env: childEnv,
      encoding: "utf8",
    });
    return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}` };
  };

  const first = attempt();
  if (first.status === 0) {
    console.log(`ok: npm run ${script}${args.length > 0 ? ` ${args.join(" ")}` : ""}`);
    return;
  }

  if (isNpmLifecyclePolicyFailure(first.output)) {
    console.log("Lifecycle-script policy blocked the npm call; retrying once with a neutral npm config.");
    const configPath = path.join(os.tmpdir(), "studio-admin-empty-npmrc");
    await writeFile(configPath, "", "utf8");
    const second = attempt({ npm_config_userconfig: configPath });
    if (second.status === 0) {
      console.log(`ok (neutral config): npm run ${script}`);
      return;
    }
    throw new Error(`npm run ${script} failed even with a neutral npm config:\n${second.output}`);
  }

  throw new Error(`npm run ${script} failed:\n${first.output}`);
}

/**
 * Exercise one derived-project profile end to end: real install, full
 * quality-gate run (typecheck, build, architecture, navigation, generated
 * context, route tree), persistent generators, and a second full gate run.
 * Uses the real repository root so the destination node_modules provides
 * the real TanStack Router CLI.
 */
async function checkProfile(repositoryRoot: string, profile: ProjectProfile): Promise<void> {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), `studio-admin-integration-${profile}-`));
  const destination = path.join(temporaryRoot, `derived-${profile}`);

  try {
    console.log(`--- integration profile: ${profile} ---`);
    await createProject({
      repositoryRoot,
      name: `derived-${profile}`,
      destination,
      profile,
      installDependencies: true,
    });

    await npmRun(destination, "validate");

    await npmRun(destination, "generate:feature", ["--", "integration-probe", "--nav"]);
    await npmRun(destination, "generate:dashboard", ["--", "integration-screen"]);
    await npmRun(destination, "generate:crud", ["--", "integration-items", "--singular", "integration-item"]);

    await npmRun(destination, "validate");

    console.log(`Integration profile ${profile}: passed`);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const repositoryRoot = process.cwd();
  const failures: string[] = [];

  for (const profile of ["full", "minimal"] as const) {
    try {
      await checkProfile(repositoryRoot, profile);
    } catch (error) {
      failures.push(`${profile}: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (failures.length > 0) {
    console.error("Integration gate failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Integration gate passed (full + minimal).");
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
