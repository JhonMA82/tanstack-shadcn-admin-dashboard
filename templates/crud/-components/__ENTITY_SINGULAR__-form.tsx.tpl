import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { {{CAMEL_SINGULAR}}Schema, type {{PASCAL_SINGULAR}}Input } from "../-schemas/{{ENTITY_SINGULAR}}";

interface {{PASCAL_SINGULAR}}FormProps {
  defaultValues?: Partial<{{PASCAL_SINGULAR}}Input>;
  onSubmit?: (values: {{PASCAL_SINGULAR}}Input) => Promise<void> | void;
}

export function {{PASCAL_SINGULAR}}Form({ defaultValues, onSubmit }: {{PASCAL_SINGULAR}}FormProps) {
  const form = useForm<{{PASCAL_SINGULAR}}Input>({
    resolver: zodResolver({{CAMEL_SINGULAR}}Schema),
    defaultValues: {
      name: "",
      status: "active",
      ...defaultValues,
    },
  });

  async function handleSubmit(values: {{PASCAL_SINGULAR}}Input) {
    await onSubmit?.(values);
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
      <div className="space-y-2">
        <label htmlFor="{{ENTITY_SINGULAR}}-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="{{ENTITY_SINGULAR}}-name"
          aria-invalid={Boolean(form.formState.errors.name)}
          aria-describedby={form.formState.errors.name ? "{{ENTITY_SINGULAR}}-name-error" : undefined}
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p id="{{ENTITY_SINGULAR}}-name-error" className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="{{ENTITY_SINGULAR}}-status" className="text-sm font-medium">
          Status
        </label>
        <select
          id="{{ENTITY_SINGULAR}}-status"
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]"
          {...form.register("status")}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving..." : "Save {{TITLE_SINGULAR}}"}
      </Button>
    </form>
  );
}
