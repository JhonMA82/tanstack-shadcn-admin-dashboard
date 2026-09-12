# Mail capsule

> Distilled from the standalone mail screen plus its dashboard preview
> (boilerplate v0.2.1). Read this capsule instead of exploring the source.
> Load the source only when a listed widget needs line-level detail.
>
> - Preview route: `src/routes/(main)/dashboard/mail/route.tsx` (iframe that
>   embeds `/mail`; open the standalone screen for real use)
> - Standalone route: `src/routes/(main)/mail/route.tsx`
> - Private widgets: `src/routes/(main)/mail/-components/`
>   (`mail.tsx`, `mail-sidebar.tsx`, `mail-list.tsx`, `mail-inbox.tsx`,
>   `mail-view.tsx`, `use-mail.ts`, `mail-layout-config.ts`, `data.tsx`)

## Use when

- Building an email or ticket inbox: folders, messages, reading pane.
- Users triage a queue (inbox, drafts, sent, spam, trash) then read one
  item deeply.
- Resizable panes (list versus reading view) match operator preference.
- Layout preference should persist across sessions via cookie.
- Compose, reply, forward, label, and archive complete the loop.
- The screen owns full height with a persistent folder rail.

## Do not use when

- Embedding a small preview is enough (use the dashboard iframe pattern,
  as the dashboard mail route does).
- The flow is realtime chat without subjects (use the chat capsule).
- Only notifications exist; a notification center or feed fits better.
- Single-message display suffices (a record screen with a message panel).
- Audit immutability forbids delete or archive (design a records surface).

## Information hierarchy

1. **Folder sidebar.** `MailSidebar`: inbox with counts, drafts, sent,
   junk, trash, plus labels. Queue position first.
2. **Message list.** `MailList` inside `MailInbox`: sender, subject,
   snippet, time, read state, selection. Triage order matches sort order.
3. **Reading pane.** `MailView`: full headers, body, attachments, and
   reply, forward, label, archive actions. One message deeply readable.
4. **Compose.** New message dialog or panel with to, subject, body, and
   send or discard. Creation never loses the inbox context.
5. **Layout persistence.** `mail-layout-config.ts` plus cookie keeps pane
   sizes across sessions; defaults apply for first visits.

## Composition

The standalone route loads layout from a cookie and owns the shell:

```text
Page (standalone /mail, loader: defaultLayout from cookie)
└── SidebarProvider (h-full min-h-0)
    ├── MailSidebar (folders + labels)
    └── MailComponent (mails + defaultLayout)
        ├── MailInbox (MailList: triage rows)
        └── MailView (reading pane + actions)
```

- `use-mail.ts` owns selection, folder, search, and compose state; widgets
  stay presentational.
- `data.tsx` holds demo mails; derived products replace it with mailbox
  queries behind the same shape.
- Resizable panes come from the layout primitives; sizes persist through
  `getValueFromCookie` plus a save-on-change handler.
- Preview route: title row with external-link button plus an iframe on
  `/mail`; never reimplements the inbox.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `MailSidebar` | sidebar primitives, `badge` | Folders with unread counts as text |
| `MailList` | list rows, `badge`, `avatar` | Sender, subject, snippet, time, flags |
| `MailView` | `card` or pane, `separator`, `button` | Headers, body, attachments, actions |
| Compose | `dialog`, `field`, `input`, `button` | To, subject, body; send and discard |
| Search | `input-group` | Scoped query with clear action |
| Layout | resizable panels, cookie | Persisted sizes with sane defaults |

- Semantic tokens only; read versus unread pairs weight with a marker dot
  plus text state, never color alone.
- Folder counts render as text so triage survives monochrome.
- Message actions carry labels; icon-only buttons expose `aria-label`s.
- Focus moves to the reading pane heading on selection and returns to the
  list on close or archive.

## Required states

- Loading: skeleton folder rail plus list rows; the reading pane shows a
  placeholder until selection loads.
- Empty folder: zero state naming the folder with compose or clear action.
- No selection: reading pane invites selection; never blank.
- No results: search-scoped message naming the query with clear.
- Sending: pending message marked queued; failure offers retry with the
  draft preserved.
- Error: per-pane error with retry; list failure never blanks a loaded
  message.
- Permission denied: restricted folders hide with explanation; send
  disables where forbidden.
- Overflow: long subjects and addresses truncate; full value on hover and
  in headers.
- Viewports: list-to-reading flow on mobile with back navigation;
  resizable panes on desktop.
- Themes: read states, badges, and body contrast verified in both modes.

## SSR notes

- The route loader reads the layout cookie on the server
  (`getValueFromCookie`) and passes `defaultLayout`; first paint already
  matches the returning layout.
- Folder contents render from server props; selection and compose state
  stay client-side in `use-mail.ts`.
- Pane resizing runs after hydration; the server render uses defaults with
  no measurement during render.
- Search and folder switches go through handlers; deep-link a message with
  search params only when support links require it.
- Send, archive, and label actions call validated server functions with
  optimistic updates reconciled against responses.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getValueFromCookie } from "@/server/server-actions";
import { mails } from "./-components/data";
import { MailComponent } from "./-components/mail";
import { DEFAULT_MAIL_LAYOUT, MAIL_LAYOUT_COOKIE } from "./-components/mail-layout-config";
import { MailSidebar } from "./-components/mail-sidebar";

export const Route = createFileRoute("/(main)/mail")({
  loader: async () => {
    const layoutCookie = await getValueFromCookie(MAIL_LAYOUT_COOKIE);
    return {
      defaultLayout: layoutCookie ? JSON.parse(layoutCookie) : [...DEFAULT_MAIL_LAYOUT],
    };
  },
  component: Page,
});

function Page() {
  const { defaultLayout } = Route.useLoaderData();
  return (
    <div className="relative h-full">
      <SidebarProvider className="h-full min-h-0">
        <MailSidebar />
        <div className="size-full">
          <div className="h-dvh min-h-0 overflow-hidden">
            <MailComponent mails={mails} defaultLayout={defaultLayout} />
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
```

## Allowed deviations

- Replace folders and labels with the product's queue model (tickets,
  cases); keep the rail, list, reading-pane contract.
- Persist selection in search params when messages must be deep-linkable.
- Swap the transport (REST, sockets) without moving ownership: snapshot
  from server, live deltas in effects.
- Add bulk triage actions only for real queue workflows with confirmation
  on destructive ones.
- Collapse to a notification feed on unrelated screens only when mail is
  genuinely secondary there.
- Promote inbox primitives to shared code only after a second consumer.
