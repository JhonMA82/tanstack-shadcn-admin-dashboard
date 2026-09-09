const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertKebabCase(value: string, label = "name"): string {
  const normalized = value.trim().toLowerCase();

  if (!KEBAB_CASE.test(normalized)) {
    throw new Error(
      `${label} must use kebab-case with lowercase letters, digits, and single hyphens. Received: ${value}`,
    );
  }

  return normalized;
}

export function singularize(value: string): string {
  if (value.endsWith("ies") && value.length > 3) {
    return `${value.slice(0, -3)}y`;
  }

  if (/(ches|shes|sses|xes|zes)$/.test(value)) {
    return value.slice(0, -2);
  }

  if (value.endsWith("s") && !value.endsWith("ss")) {
    return value.slice(0, -1);
  }

  return value;
}

export function pluralize(value: string): string {
  if (value.endsWith("y") && !/[aeiou]y$/.test(value)) {
    return `${value.slice(0, -1)}ies`;
  }

  if (/(ch|sh|ss|x|z)$/.test(value)) {
    return `${value}es`;
  }

  if (value.endsWith("s")) {
    return value;
  }

  return `${value}s`;
}

export function pascalCase(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}

export function camelCase(value: string): string {
  const pascal = pascalCase(value);
  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}

export function titleCase(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
