# Chat capsule

> Distilled from the standalone chat screen plus its dashboard preview
> (boilerplate v0.2.1). Read this capsule instead of exploring the source.
> Load the source only when a listed widget needs line-level detail.
>
> - Preview route: `src/routes/(main)/dashboard/chat/route.tsx` (iframe that
>   embeds `/chat`; open the standalone screen for real use)
> - Standalone route: `src/routes/(main)/chat/route.tsx`
> - Private widgets: `src/routes/(main)/chat/-components/`
>   (`chat.tsx`, `chat-sidebar.tsx`, `chat-header.tsx`,
>   `chat-conversation-list.tsx`, `chat-thread.tsx`,
>   `chat-profile-details.tsx`, `use-chat.ts`, `data.ts`)

## Use when

- Building a conversational surface: support chat, team messaging, or
  direct messages.
- Users switch between many conversations and one active thread.
- Presence, typing state, or per-conversation metadata matters.
- The screen owns full height with a persistent conversation list.
- Message history must stay readable while composing.
- Contact or profile context sits beside the thread on wide screens.

## Do not use when

- Embedding a small preview is enough (use the dashboard iframe pattern,
  as the dashboard chat route does).
- The flow is email with subjects and folders (use the mail capsule).
- The flow is comments on a record (a threaded comment widget grafted onto
  the record screen is enough).
- Only one fixed thread exists; the sidebar and switching machinery add
  needless complexity.
- History needs audit-grade immutability (design a dedicated transcript
  surface instead).

## Information hierarchy

1. **Chat header.** Conversation or workspace title, connection state, and a
   maximum of two primary actions. Orientation before content.
2. **Conversation sidebar.** Search plus conversation list ordered by recent
   activity, with unread markers and presence dots. Selection switches the
   active thread; the list never unmounts.
3. **Active thread.** Message bubbles grouped by sender and day, oldest at
   top, newest at bottom, auto-anchored to the latest message. Reading order
   matches the DOM order.
4. **Composer.** Text input with send action, attachment affordance, and
   typing indicator. Always visible while a thread is open.
5. **Profile details.** Contact or group metadata beside the thread on wide
   screens, collapsible or hidden on narrow screens. Lowest priority.

## Composition

The standalone route owns the three-pane shell inside a `SidebarProvider`:

```text
Page (standalone /chat)
└── SidebarProvider (flex-col)
    ├── ChatHeader
    └── flex flex-1
        ├── ChatSidebar (search + ChatConversationList)
        └── Chat (active thread)
            ├── ChatThread (message groups)
            ├── composer (input + send)
            └── ChatProfileDetails (wide screens)
```

- Preview route: title row with external-link button plus an iframe on
  `/chat`; never reimplements the thread.
- `use-chat.ts` owns selection, draft, and send state; widgets stay
  presentational.
- `data.ts` holds typed demo conversations; derived products replace it
  with a subscribed server source behind the same shape.
- Mobile shows one pane at a time (list, then thread) with back navigation;
  desktop shows list plus thread, profile collapsible.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `ChatHeader` | `button`, `avatar` | Title, presence, call or info actions |
| `ChatSidebar` | `input-group`, scroll area | Search plus list; unread counts as text |
| `ChatConversationList` | `avatar`, `badge` | Rows with snippet, time, unread marker |
| `ChatThread` | scroll area | Grouped bubbles; day separators as headings |
| Composer | `input` or textarea, `button` | Send on Control+Enter; disabled while sending |
| `ChatProfileDetails` | `card`, `avatar`, `separator` | Contact metadata; collapsible panel |

- Semantic tokens only; incoming and outgoing bubbles differ by placement
  plus contrast, never color alone.
- Unread state pairs a count with bold text so it survives monochrome.
- Timestamps use relative labels near ("2m ago") and absolute on hover or
  focus for screen readers.
- Focus moves into the thread heading on conversation switch and returns to
  the list on back navigation.

## Required states

- Loading: skeleton conversation rows plus a thread placeholder; the header
  mounts first so layout stays stable.
- Empty inbox: list shows a zero state with a start-conversation action.
- Empty thread: new conversations show the contact header plus composer,
  not a blank pane.
- Sending: optimistic bubble marked pending; failure flips it to an error
  state with retry, never silent loss.
- Connection loss: header banner names the state ("Reconnecting"); queued
  drafts persist locally.
- Error: failed history load offers retry; the composer stays usable for
  drafts when permitted.
- Permission denied: restricted threads hide content and explain access;
  the list omits or locks them.
- Overflow: long messages wrap; code or links scroll inside the bubble, not
  the page; day separators stay sticky-readable.
- Viewports: single pane with back navigation on mobile; two or three panes
  on desktop.
- Themes: bubble contrast verified in both modes; typing indicator stays
  visible on every background.

## SSR notes

- The standalone route renders the shell plus initial conversations on the
  server; message subscription starts in an effect after hydration.
- `use-chat.ts` keeps selection and drafts client-side; server state is the
  source of truth for history.
- Auto-scroll to latest runs in an effect, guarded so server render shows
  the thread top without mismatch.
- Presence and typing indicators are live-only affordances; they render
  nothing on the server and appear after hydration.
- Send actions call validated server functions; drafts survive remount via
  local state keyed by conversation id.
- The dashboard preview iframe is a static embed with a title and an
  open-in-new-tab link; it fetches nothing itself.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Chat } from "./-components/chat";
import { ChatHeader } from "./-components/chat-header";
import { ChatSidebar } from "./-components/chat-sidebar";
import { conversations } from "./-components/data";

export const Route = createFileRoute("/(main)/chat")({
  component: Page,
});

function Page() {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <ChatHeader />
        <div className="flex flex-1">
          <ChatSidebar />
          <Chat conversations={conversations} />
        </div>
      </SidebarProvider>
    </div>
  );
}
```

Dashboard preview shape (for embedding, not for reimplementation):

```tsx
function ChatPreview() {
  return (
    <div className="flex h-full flex-col gap-2">
      {/* title row + open-in-new-tab button */}
      <iframe
        src="/chat"
        title="Chat preview"
        className="min-h-0 flex-1 rounded-lg border bg-background"
      />
    </div>
  );
}
```

## Allowed deviations

- Replace the profile panel content with the product's contact or ticket
  metadata; keep it collapsible and lowest priority.
- Persist the active conversation id in search params when threads must be
  deep-linkable.
- Swap the transport (sockets, polling, server-sent events) without moving
  ownership: subscription in effects, history from the server.
- Add message actions (react, reply, forward) as icon buttons with labels;
  keep send and attach primary.
- Collapse to a docked chat widget on unrelated screens only when chat is
  genuinely secondary there.
- Promote thread primitives to shared components only after a second
  concrete consumer exists.
