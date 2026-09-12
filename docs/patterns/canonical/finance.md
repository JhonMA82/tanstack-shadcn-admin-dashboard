# Finance dashboard capsule

> Distilled from `src/routes/(main)/dashboard/finance/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/finance/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/finance/-components/`
>   (`overview-kpis.tsx`, `wallet.tsx`, `transactions-overview-card.tsx`,
>   `balance-distribution-card.tsx`, `income-breakdown.tsx`,
>   `upcoming-transactions.tsx`, `quick-actions.tsx`,
>   `finance-notification.tsx`)

## Use when

- Building a personal or small-business finance overview.
- The primary question is "where does my money stand and move".
- Content mixes balances (state) with flows (transactions over time).
- Users switch lenses: Dashboard, Accounts, Transactions.
- Upcoming and scheduled items need a dedicated watchlist.
- Quick actions (transfer, pay, top up) start from the overview.

## Do not use when

- Data is storefront sales (use the ecommerce capsule).
- The screen is corporate reporting with statements (design a ledger
  surface; this capsule is positional, not accounting).
- Traffic or engagement dominates (use the analytics-dashboard capsule).
- One account record is the whole screen (use the profile capsule shape
  with account panels).
- No transaction stream exists; the flow panels would be empty shells.

## Information hierarchy

1. **Header with freshness plus utilities.** "Personal Finances" plus
   formatted date; "Updated 5 min ago" marker with Settings and Export
   (outline) actions. Trust first: staleness is always visible.
2. **Lens tabs.** Line-variant `TabsList`: Dashboard, Accounts,
   Transactions. Tabs answer "which money question".
3. **Position row.** `OverviewKpis` (income, expenses, savings rate) beside
   `Wallet` (balances per account). Flows left, state right.
4. **Movement chart.** `TransactionsOverviewCard`: inflow versus outflow
   over the selected range. Explains how the position changed.
5. **Breakdown row.** `BalanceDistributionCard` (where money sits) beside
   `IncomeBreakdown` (where it comes from). Allocation evidence.
6. **Action row.** `UpcomingTransactions` watchlist beside `QuickActions`
   launcher. What happens next, and what the user can do now.

## Composition

`route.tsx` owns the header plus tabs; the Dashboard panel stacks three
paired grids:

```text
Page
├── header (title + date + freshness + Settings + Export)
└── Tabs (defaultValue="30-days", line variant)
    └── TabsContent Dashboard
        ├── grid xl:grid-cols-12: OverviewKpis (6) + Wallet (6)
        ├── TransactionsOverviewCard (full width)
        ├── grid xl:grid-cols-12: BalanceDistribution (6) + IncomeBreakdown (6)
        └── grid xl:grid-cols-12: UpcomingTransactions (8) + QuickActions (4)
```

- Container: `flex flex-col gap-4`; tab content repeats the rhythm per lens.
- Freshness marker pairs icon with text ("Updated 5 min ago"), never a dot
  alone.
- `FinanceNotification` surfaces alerts (bill due, low balance) above the
  affected panel, not as toasts that vanish.
- Below `xl` every pair stacks in reading order; actions stay reachable.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `OverviewKpis` | `card`, `item` | Income, expenses, savings with deltas |
| `Wallet` | `card`, `avatar` or brand icon | Per-account balances with last-four |
| `TransactionsOverviewCard` | `card`, `chart` (recharts) | Inflow vs outflow series with legend |
| `BalanceDistributionCard` | `card`, `chart` | Allocation donut with labelled shares |
| `IncomeBreakdown` | `card`, `item`, `separator` | Source rows with amounts and share |
| `UpcomingTransactions` | `card`, `badge` | Scheduled rows with due dates |
| `QuickActions` | `card`, `button` | Transfer, pay, top-up launchers |
| `FinanceNotification` | alert or `card` | Bill and balance alerts with actions |

- Semantic tokens only; money direction pairs sign text with variant, never
  color alone.
- Amounts use tabular numerals and locale formatting from server-passed
  values.
- Account identity shows institution plus masked number, never full numbers.
- Export and Settings mirror the header on every lens so utilities never
  hide inside one tab.

## Required states

- Loading: skeleton position row plus fixed-height chart placeholder; tabs
  stay mounted during lens switches.
- Empty accounts: wallet zero state with connect or add action.
- No transactions: chart area shows a textual summary, not empty axes.
- No upcoming items: watchlist states the calm with a schedule action.
- Stale data: freshness marker escalates ("Updated 2h ago") with refresh.
- Error: per-widget error with retry; position stays when flow fails.
- Permission denied: amounts mask while structure remains; actions hide
  with explanation.
- Overflow: long payee and account names truncate; full value on hover.
- Viewports: pairs stack below `xl`; quick actions wrap with `flex-wrap`.
- Themes: chart, donut, and badge contrast verified in both modes.

## SSR notes

- `route.tsx` is SSR-safe; dates and amounts derive from server-passed
  values to avoid hydration mismatch.
- Tab state is local (`defaultValue`) in the source; promote the lens to
  search params only when deep-linking a lens matters.
- Charts are client islands: static summary plus axes on the server,
  tooltips and hover after hydration.
- Export builds the file in a handler (never during render) and announces
  completion; Settings navigates, it never mutates inline.
- Quick actions open dialogs from event handlers; forms validate before
  calling server functions.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BalanceDistributionCard } from "./-components/balance-distribution-card";
import { IncomeBreakdown } from "./-components/income-breakdown";
import { OverviewKpis } from "./-components/overview-kpis";
import { QuickActions } from "./-components/quick-actions";
import { TransactionsOverviewCard } from "./-components/transactions-overview-card";
import { UpcomingTransactions } from "./-components/upcoming-transactions";
import { Wallet } from "./-components/wallet";

export const Route = createFileRoute("/(main)/dashboard/finance")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-4">
      {/* header: title + date + freshness + Settings + Export */}
      <Tabs defaultValue="30-days" className="flex flex-col gap-4">
        {/* tab row: line-variant TabsList */}
        <TabsContent value="30-days" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <OverviewKpis />
            </div>
            <div className="xl:col-span-6">
              <Wallet />
            </div>
          </div>
          <TransactionsOverviewCard />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <BalanceDistributionCard />
            </div>
            <div className="xl:col-span-6">
              <IncomeBreakdown />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <UpcomingTransactions />
            </div>
            <div className="xl:col-span-4">
              <QuickActions />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Allowed deviations

- Change lens names to the product's money questions; keep three or fewer
  lenses.
- Swap KPI and wallet content for business accounts; keep the flows-left,
  state-right pairing.
- Replace allocation widgets with the product's breakdown (by category,
  by project); keep labelled shares, not bare charts.
- Promote the lens and range to the URL when money views must be shared.
- Add scheduled-payment actions only beside real scheduling capability.
- Mask aggressively: full account numbers never render, demo or real.
