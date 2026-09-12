# Invoice capsule

> Distilled from `src/routes/(main)/dashboard/invoice/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/invoice/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/invoice/-components/`
>   (`invoice.tsx`, `invoice-form.tsx`, `invoice-items.tsx`,
>   `invoice-details.tsx`, `invoice-adjustments.tsx`, `client-selector.tsx`,
>   `invoice-preview.tsx`, `invoice-paper.tsx`, `print-invoice.tsx`,
>   `use-visible-center-position.ts`, `data.ts`)

## Use when

- Building a document composer with a live preview: invoices, quotes,
  receipts, contracts.
- Users edit structured fields on one side and verify the rendered paper
  on the other.
- Line items need add, edit, reorder, and remove with live totals.
- Client selection, adjustments (tax, discount, shipping), and notes ship
  as one submit.
- Save-as-draft plus send (or print) are the two terminal actions.
- Print fidelity matters enough to own a paper component.

## Do not use when

- Editing a plain record without a rendered output (use crud-feature).
- The document is read-only history (a detail view with print suffices).
- Line items do not exist; the form-plus-preview split adds ceremony.
- Approval chains dominate (design a workflow screen; graft this composer
  as one step).
- The output is data export rather than a human-read document (export
  belongs in a header action, as in finance).

## Information hierarchy

1. **Composer header.** "Create New Invoice" plus purpose line; Save as
   Draft (outline) and Send Invoice (primary) right-aligned. Terminal
   actions stay visible while editing.
2. **Form column.** Client selector, invoice details (number, dates, terms),
   line items editor, adjustments, notes. Input order matches the paper
   reading order so verification scans straight across.
3. **Preview column.** `InvoicePaper` rendering the current draft: header,
   client block, items table, totals, notes. Read-only; every keystroke in
   the form reflects here.
4. **Print output.** `PrintInvoice` produces the clean paper without chrome
   for print media or PDF. Screen chrome never leaks onto paper.

## Composition

`route.tsx` owns the header; `Invoice` owns the form-plus-preview split:

```text
Page
├── header (title + line + Save as Draft + Send Invoice)
└── Invoice
    ├── form column
    │   ├── ClientSelector
    │   ├── InvoiceDetails (number, dates, terms)
    │   ├── InvoiceItems (line editor)
    │   ├── InvoiceAdjustments (tax, discount, shipping)
    │   └── notes field
    └── preview column
        ├── InvoicePreview (live wrapper)
        ├── InvoicePaper (print-faithful sheet)
        └── PrintInvoice (print trigger)
```

- Container: `flex flex-col gap-6`; composer splits into columns on `lg`,
  stacks with preview below the form on narrow screens.
- `use-visible-center-position.ts` keeps the preview anchored while the
  form grows; scroll math lives in an effect, never in render.
- Totals derive from items plus adjustments through one typed calculation;
  form and paper share it, never duplicate it.
- Validation follows the form pattern (React Hook Form plus Zod); send is
  disabled until valid, draft saves partial input.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `ClientSelector` | `select` or `popover`, `avatar` | Client rows with name plus identifier |
| `InvoiceDetails` | `field`, `input`, calendar primitive | Number, issue and due dates, terms |
| `InvoiceItems` | `field`, `input-group`, `button` | Description, quantity, rate, line total |
| `InvoiceAdjustments` | `field`, `input`, `select` | Tax, discount, shipping rows |
| `InvoicePreview` | `card` or sheet | Live wrapper around the paper |
| `InvoicePaper` | `table`, `separator` | Print-faithful document surface |
| `PrintInvoice` | `button` | Print trigger with `aria-label` |

- Semantic tokens only on screen; the paper uses high-contrast ink-on-white
  that survives printing.
- Amounts use tabular numerals with locale formatting from typed values.
- Every field carries a real label; line-item grids keep column headers
  associated for screen readers.
- `button-group` joins related item actions; destructive remove confirms.

## Required states

- Loading: skeleton form plus skeleton paper; header actions disable until
  the draft loads.
- New draft: defaults preselected (next number, today, standard terms) so
  the paper never renders empty chrome.
- No client: paper shows an explicit placeholder block, not a blank space.
- No items: items table shows a zero row with an add action; totals show
  zeros.
- Invalid: inline field errors with associations; send stays disabled with
  the reason announced.
- Saving or sending: pending buttons with disabled semantics; double submit
  guarded.
- Error: failed save or send shows an inline error with retry; the draft
  persists locally.
- Permission denied: viewers get preview plus print without form controls.
- Overflow: long descriptions wrap on paper; screen rows truncate with full
  value on hover.
- Viewports: single column below `lg`; print CSS hides app chrome at any
  size.
- Themes: screen follows theme; paper stays print-legible in both modes.

## SSR notes

- `route.tsx` is SSR-safe; the draft loads from server props or a loader.
- Form state initializes from server data once; remount keys reset the form
  when switching drafts, avoiding stale defaults.
- The preview derives purely from form values during render; no effects
  needed for the live reflection.
- Scroll anchoring and print triggers run in effects or handlers behind
  guards; the server render shows the static split.
- Date display uses server-passed values; calendar popovers open from
  handlers, never during render.
- Send and draft actions call validated server functions; navigation after
  send happens in the handler.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Invoice } from "./-components/invoice";

export const Route = createFileRoute("/(main)/dashboard/invoice")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-3xl leading-none tracking-tight">
            Create New Invoice
          </h1>
          <p className="text-muted-foreground text-sm">
            Add invoice details, review the preview, and send it to your client.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline">
            <Save data-icon="inline-start" />
            Save as Draft
          </Button>
          <Button type="button">
            <Send data-icon="inline-start" />
            Send Invoice
          </Button>
        </div>
      </div>
      <Invoice />
    </div>
  );
}
```

## Allowed deviations

- Rename sections to the product's document (quote, receipt, order); keep
  the form-left, paper-right contract.
- Extend adjustments with product rows (fees, credits); route every row
  through the shared totals calculation.
- Add approval or signature steps after send; keep draft plus send as the
  composer terminals.
- Persist the draft id in search params when drafts must be deep-linkable.
- Swap print for PDF export only when the product truly prints never; keep
  the chrome-free paper either way.
- Promote the paper component to shared code only after a second document
  type consumes it.
