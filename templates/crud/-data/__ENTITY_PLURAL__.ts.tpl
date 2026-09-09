export interface {{PASCAL_SINGULAR}} {
  id: string;
  name: string;
  status: "active" | "inactive";
}

export const {{CAMEL_PLURAL}}: {{PASCAL_SINGULAR}}[] = [
  {
    id: "example-1",
    name: "Example {{TITLE_SINGULAR}}",
    status: "active",
  },
];
