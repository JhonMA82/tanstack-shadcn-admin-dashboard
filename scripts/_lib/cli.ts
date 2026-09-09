export interface ParsedArgs {
  positionals: string[];
  flags: Map<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }

    const withoutPrefix = value.slice(2);
    const equalsIndex = withoutPrefix.indexOf("=");

    if (equalsIndex >= 0) {
      flags.set(withoutPrefix.slice(0, equalsIndex), withoutPrefix.slice(equalsIndex + 1));
      continue;
    }

    if (withoutPrefix.startsWith("no-")) {
      flags.set(withoutPrefix.slice(3), false);
      continue;
    }

    const nextValue = argv[index + 1];
    if (nextValue && !nextValue.startsWith("--")) {
      flags.set(withoutPrefix, nextValue);
      index += 1;
      continue;
    }

    flags.set(withoutPrefix, true);
  }

  return { positionals, flags };
}

export function stringFlag(args: ParsedArgs, name: string, fallback?: string): string | undefined {
  const value = args.flags.get(name);
  if (typeof value === "string") {
    return value;
  }
  return fallback;
}

export function booleanFlag(args: ParsedArgs, name: string, fallback = false): boolean {
  const value = args.flags.get(name);
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return !["false", "0", "no", "off"].includes(value.toLowerCase());
  }
  return fallback;
}

export function printUsage(lines: string[]): void {
  console.log(lines.join("\n"));
}

export function fail(message: string): never {
  throw new Error(message);
}
