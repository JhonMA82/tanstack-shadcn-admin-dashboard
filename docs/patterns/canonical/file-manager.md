# File manager capsule

> Distilled from `src/routes/(main)/dashboard/file-manager/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/file-manager/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/file-manager/-components/`
>   (`data.ts`, `file-manager-toolbar.tsx`, `folders-section.tsx`,
>   `file-grid-view.tsx`, `file-list-view.tsx`, `file-actions.tsx`)

## Use when

- Building a file, asset, or document library with folders and files.
- Users switch between grid (visual browsing) and list (dense detail)
  presentations of the same collection.
- Search, filter, and sort scope the collection without navigation.
- Row or card actions (share, rename, move, delete) apply per item.
- Creation means New Folder plus Upload side by side.
- The view choice should survive reloads and be shareable.

## Do not use when

- Files attach to a single record (an attachment list on the record screen
  is enough).
- The collection is tasks, orders, or users rather than files (use those
  capsules for domain-appropriate columns and actions).
- Only one presentation fits; the view toggle would be decoration.
- Version history or approval workflows dominate (design a document
  workflow screen instead).
- Storage management (quotas, policies) is the product; graft a usage
  panel onto this shell instead.

## Information hierarchy

1. **Library header with creation actions.** "My files" plus purpose line;
   New Folder (outline) and Upload (primary) right-aligned. Creation first.
2. **Toolbar.** Search input plus filter and sort controls. Narrows the
   collection in place.
3. **Folders section.** Folder cards with names and item counts. Navigation
   into a scope, above the file stream.
4. **Files section with view toggle.** "All files" heading plus grid/list
   toggle; the collection renders as cards or as a dense table. The toggle
   reflects the `view` search param (`grid` default, `list` alternate).

## Composition

`route.tsx` validates the `view` search param and stacks four blocks:

```text
Page (validateSearch: { view: "grid" | "list" })
├── header (title + line + New folder + Upload)
├── FileManagerToolbar (search + filters + sort)
├── FoldersSection (folders)
└── files block
    ├── row: "All files" heading + ToggleGroup (grid | list)
    ├── FileGridView (view === "grid")
    └── FileListView (view === "list")
```

- Toggle items render as router `Link`s updating `search` with `replace`,
  so the view is bookmarkable and back-button safe.
- `data.ts` holds typed demo files and folders; derived products replace it
  with server queries behind the same item shape.
- `file-actions.tsx` centralizes per-item actions so grid cards and list
  rows offer identical menus.
- The list view follows the data-table pattern at file-appropriate density.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `FileManagerToolbar` | `input-group`, `button`, `select` | Search plus filter and sort controls |
| `FoldersSection` | `card`, `button` | Folder cards with counts; keyboard-openable |
| `FileGridView` | `card`, `avatar` or thumb, `badge` | Thumbnail cards with type badge and menu |
| `FileListView` | `table`, `badge`, `checkbox` | Name, size, modified, shared-with, actions |
| `file-actions` | dropdown `menu`, `button` | Share, rename, move, delete; same both views |
| Empty states | `empty` | Zero states for folders and files |

- Semantic tokens only; file-type meaning travels in icon plus text label,
  never color alone.
- Sizes use human units; dates use relative labels with absolute on hover.
- View toggle is a labelled `ToggleGroup` with `aria-label="File view"`.
- Destructive actions confirm before running and announce results.

## Required states

- Loading: skeleton folder row plus file skeletons in the active view; the
  toolbar stays mounted so search feels instant.
- Empty library: full zero state with Upload and New Folder actions.
- Empty folder: scoped zero state naming the folder.
- No results: toolbar-scoped message naming the query with a clear action.
- Uploading: progress affordance on the pending item; failures offer retry
  without losing the queue.
- Error: inline error with retry; cached listing stays visible when
  available.
- Permission denied: read-only viewers lose Upload, New Folder, and
  destructive actions with one explanation.
- Overflow: long filenames truncate with ellipsis; full name on hover and
  in the detail menu.
- Viewports: grid columns collapse 4 to 2 to 1; list scrolls horizontally
  inside its container with sticky header.
- Themes: thumbnails and badges verified in both modes.

## SSR notes

- `route.tsx` is SSR-safe; `validateSearch` runs on both server and client
  so the first paint already shows the correct view.
- The active view derives from `Route.useSearch()`; no local mirror state
  that could diverge.
- Listings render server-provided first results; search and pagination
  hydrate client-side and update search params through links.
- Uploads and mutations run through validated server functions; progress
  lives in effects with cleanup.
- Thumbnails render static placeholders on the server; object URLs or lazy
  images resolve after hydration behind guards.

## Snippet (SSR-safe)

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { Grid2X2, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type FileManagerView, files, folders } from "./-components/data";
import { FileGridView } from "./-components/file-grid-view";
import { FileListView } from "./-components/file-list-view";
import { FileManagerToolbar } from "./-components/file-manager-toolbar";
import { FoldersSection } from "./-components/folders-section";

export const Route = createFileRoute("/(main)/dashboard/file-manager")({
  validateSearch: (search: Record<string, unknown>): { view: FileManagerView } => ({
    view: search.view === "list" ? "list" : "grid",
  }),
  component: Page,
});

function Page() {
  const { view: activeView } = Route.useSearch();

  return (
    <div className="flex flex-col gap-4">
      {/* header + toolbar + folders */}
      <FileManagerToolbar />
      <FoldersSection folders={folders} />
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-medium text-lg">All files</h2>
        <ToggleGroup variant="outline" size="sm" value={[activeView]} aria-label="File view">
          <ToggleGroupItem
            value="grid"
            render={<Link from={Route.fullPath} search={(p) => ({ ...p, view: "grid" })} replace />}
          >
            <Grid2X2 /> Grid View
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            render={<Link from={Route.fullPath} search={(p) => ({ ...p, view: "list" })} replace />}
          >
            <List /> List View
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {activeView === "grid" ? <FileGridView files={files} /> : <FileListView files={files} />}
    </div>
  );
}
```

## Allowed deviations

- Add folder-scoped search params (folder id, query, sort) when deep
  navigation must be shareable; validate every param.
- Replace demo `data.ts` with paginated server queries; keep the item shape
  so both views stay in sync.
- Add bulk selection and actions only for real multi-file workflows.
- Swap the files table columns for product metadata; keep name, size,
  modified, and actions.
- Add a detail panel or preview dialog without removing either view.
- Promote file primitives to shared code only after a second concrete
  consumer.
