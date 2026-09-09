import { z } from "zod";

export const {{CAMEL_SINGULAR}}Schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  status: z.enum(["active", "inactive"]),
});

export type {{PASCAL_SINGULAR}}Input = z.infer<typeof {{CAMEL_SINGULAR}}Schema>;
