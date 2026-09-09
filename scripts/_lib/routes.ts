import { walkFiles } from "./files.js";
import path from "node:path";

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

export function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isPrivateSegment(segment: string): boolean {
  return segment.startsWith("-");
}

function isRouteFileName(fileName: string): boolean {
  return fileName === "route.tsx" || fileName === "index.tsx";
}

/**
 * Map one TanStack Start path segment to its URL contribution.
 * Route groups `(group)` contribute nothing, `-private` segments are skipped
 * (their routes are never addressable), `$param` becomes `:param`, and a
 * bare `$`/`$.tsx` becomes a splat.
 */
function routeSegment(segment: string): string | null {
  if (isRouteGroup(segment)) {
    return null;
  }

  if (segment === "$" || segment === "$_splat") {
    return "*";
  }

  if (segment.startsWith("$")) {
    const name = segment.slice(1);
    return name ? `:${name}` : "*";
  }

  return segment;
}

/**
 * Convert a TanStack Start route file to its URL path. Accepts directory
 * routes (`<dir>/route.tsx`), file routes (`<dir>/$param.tsx`), and splat
 * routes (`<dir>/$.tsx`). Returns null for files under `-private` segments,
 * which are excluded from route generation.
 */
export function routeFileToRoute(routesRoot: string, routeFile: string): string | null {
  const relative = normalizeSlash(path.relative(routesRoot, routeFile));
  const parts = relative.split("/").filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  const fileName = parts[parts.length - 1];
  const directoryParts = parts.slice(0, -1);

  if (fileName === "$.tsx") {
    const segments = directoryParts.map(routeSegment).filter((segment): segment is string => Boolean(segment));
    return `/${[...segments, "*"].join("/")}`;
  }

  if (fileName.startsWith("$") && fileName.endsWith(".tsx")) {
    const segments = directoryParts.map(routeSegment).filter((segment): segment is string => Boolean(segment));
    const param = routeSegment(fileName.slice(0, -".tsx".length));
    if (param) {
      segments.push(param);
    }
    return `/${segments.join("/")}`;
  }

  if (!isRouteFileName(fileName)) {
    return null;
  }

  if ([...directoryParts, ...directoryParts].some((segment) => isPrivateSegment(segment))) {
    return null;
  }

  const segments = directoryParts.map(routeSegment).filter((segment): segment is string => Boolean(segment));

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

/**
 * Convert a TanStack file route id (which includes groups, for example
 * `/(main)/dashboard/reports`) to its public URL by stripping `(group)`
 * segments.
 */
export function routeIdToUrl(routeId: string): string {
  const segments = routeId
    .split("/")
    .filter(Boolean)
    .filter((segment) => !isRouteGroup(segment))
    .map(routeSegment)
    .filter((segment): segment is string => Boolean(segment));

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

/**
 * Scan `route.tsx` (plus `$param.tsx` and `$.tsx`) files under a TanStack
 * `src/routes` root and return sorted URL paths.
 */
export async function scanRoutes(routesRoot: string): Promise<string[]> {
  const routeFiles = await walkFiles(
    routesRoot,
    (filePath) =>
      path.basename(filePath) === "route.tsx" ||
      path.basename(filePath) === "index.tsx" ||
      (path.basename(filePath).startsWith("$") && filePath.endsWith(".tsx")),
  );

  const routes = new Set<string>();
  for (const file of routeFiles) {
    const route = routeFileToRoute(routesRoot, file);
    if (route) {
      routes.add(route);
    }
  }

  return [...routes].sort((a, b) => a.localeCompare(b));
}

/** Backwards-compatible alias: the routes root replaces the old app root. */
export async function scanAppRoutes(routesRoot: string): Promise<string[]> {
  return scanRoutes(routesRoot);
}

/** Backwards-compatible alias for the old Next.js page-file helper. */
export function pageFileToRoute(routesRoot: string, routeFile: string): string {
  return routeFileToRoute(routesRoot, routeFile) ?? "/";
}

export function routeMatchesUrl(route: string, rawUrl: string): boolean {
  const url = rawUrl.split(/[?#]/)[0];
  const routeSegments = route.split("/").filter(Boolean);
  const urlSegments = url.split("/").filter(Boolean);

  for (let routeIndex = 0, urlIndex = 0; routeIndex < routeSegments.length; routeIndex += 1) {
    const segment = routeSegments[routeIndex];

    if (segment.startsWith("*")) {
      const optional = segment.endsWith("?");
      return optional || urlIndex < urlSegments.length;
    }

    if (urlIndex >= urlSegments.length) {
      return false;
    }

    if (!segment.startsWith(":") && segment !== urlSegments[urlIndex]) {
      return false;
    }

    urlIndex += 1;

    if (routeIndex === routeSegments.length - 1 && urlIndex !== urlSegments.length) {
      return false;
    }
  }

  return routeSegments.length === 0 ? urlSegments.length === 0 : routeSegments.length > 0;
}

export function isExternalUrl(url: string): boolean {
  return /^(https?:|mailto:|tel:|#)/.test(url);
}

export function extractNavigationUrls(source: string): string[] {
  const urls = [...source.matchAll(/\burl:\s*["']([^"']+)["']/g)].map((match) => match[1]);
  return [...new Set(urls)].sort((a, b) => a.localeCompare(b));
}

export function extractNavigationIds(source: string): string[] {
  return [...source.matchAll(/\bid:\s*["']([^"']+)["']/g)].map((match) => match[1]);
}
