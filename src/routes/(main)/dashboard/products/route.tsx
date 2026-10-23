import { createFileRoute } from "@tanstack/react-router";

import { AddProductDrawer } from "./-components/add-product-drawer";
import { Products } from "./-components/products";

export const Route = createFileRoute("/(main)/dashboard/products")({
  head: () => ({
    meta: [
      { title: "Open Source Product Management Dashboard with shadcn/ui" },
      {
        name: "description",
        content: "Manage an ecommerce product catalog with categories, inventory, availability, pricing, and sales.",
      },
    ],
    links: [{ rel: "canonical", href: "/dashboard/products" }],
  }),
  component: Page,
});

function Page() {
  return (
    <div data-content-padding="false">
      <div className="flex h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 min-w-0 flex-col gap-4 md:gap-6">
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-4 pt-4 md:px-6 md:pt-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl leading-none font-normal tracking-tight">Products</h1>
            <p className="text-muted-foreground text-sm">
              Manage your catalog, inventory, pricing, and product availability.
            </p>
          </div>
          <AddProductDrawer />
        </div>
        <Products />
      </div>
    </div>
  );
}
