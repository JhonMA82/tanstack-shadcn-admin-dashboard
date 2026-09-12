import { pathExists } from "./files.js";
import { spawnSync } from "node:child_process";
import path from "node:path";

/**
 * Resolve the Biome CLI, preferring a destination installation over the
 * boilerplate source so derived projects format with their own toolchain.
 */
export async function resolveBiomeBinary(repositoryRoot: string, destination?: string): Promise<string | null> {
  const binaryName = process.platform === "win32" ? "biome.cmd" : "biome";
  const candidates = destination
    ? [
        path.join(destination, "node_modules", ".bin", binaryName),
        path.join(repositoryRoot, "node_modules", ".bin", binaryName),
      ]
    : [path.join(repositoryRoot, "node_modules", ".bin", binaryName)];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Format generated files with the repository's Biome config so generator
 * output passes `npm run check` regardless of runtime values (long titles,
 * wrapped JSX text, etc.). Skipping is only acceptable where no Biome
 * installation exists (lightweight fixtures); a real derived project always
 * has Biome after `npm install`, and a failed formatting run must fail the
 * generator instead of shipping output the quality gates would reject.
 */
export async function formatGeneratedFiles(repositoryRoot: string, files: string[]): Promise<void> {
  if (files.length === 0) {
    return;
  }

  const biomeBinary = await resolveBiomeBinary(repositoryRoot);

  if (!biomeBinary) {
    console.warn(
      "Biome CLI not found; skipping formatting of generated files." +
        " Run `npx biome format --write` after installing dependencies.",
    );
    return;
  }

  const result = spawnSync(biomeBinary, ["format", "--write", "--no-errors-on-unmatched", ...files], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const details = typeof result.stderr === "string" && result.stderr.trim() ? `: ${result.stderr.trim()}` : ".";
    throw new Error(`Biome formatting of generated files failed${details}`);
  }

  console.log(`Formatted ${files.length} generated file(s) with Biome.`);
}
