# Profile capsule

> Distilled from `src/routes/(main)/dashboard/profile/` (boilerplate v0.2.1).
> Read this capsule instead of exploring the source. Load the source only when a
> listed widget needs line-level detail.
>
> - Source route: `src/routes/(main)/dashboard/profile/route.tsx`
> - Private widgets: `src/routes/(main)/dashboard/profile/-components/`
>   (`profile-data.ts`, `profile-header.tsx`, `profile-overview.tsx`,
>   `profile-personal-details.tsx`, `profile-employment-details.tsx`,
>   `profile-time-off-details.tsx`, `profile-documents.tsx`,
>   `profile-status-sidebar.tsx`)

## Use when

- Building a per-person record: employee, member, customer, student.
- The primary question is "who is this person and what is their state".
- Identity header plus tabbed detail sections fit the content.
- A status sidebar (role, team, dates, flags) summarizes beside narrative
  overview content.
- Sections split naturally: overview, personal, employment, compensation,
  time off, documents.
- Breadcrumb context (directory to person to detail) orients the reader.

## Do not use when

- The screen aggregates many people (use users or roles capsules).
- Editing dominates reading (use crud-feature with a form-first layout).
- The record is a company, project, or asset rather than a person (mirror
  the shape but rename; do not force person fields).
- A single-section record fits; tabs for one panel add ceremony.
- Public profiles need SEO or sharing semantics this private screen skips.

## Information hierarchy

1. **Breadcrumb.** Dashboard, directory, person name, current section.
   Orientation for deep records.
2. **Identity header.** `ProfileHeader`: avatar, name, role or title,
   key badges (status, team), plus at most two actions (message, edit).
   Who, in five seconds.
3. **Section tabs.** Line-variant tabs: Overview, Personal, Employment,
   Compensation, Time off, Documents. Scrollable tab row on narrow screens.
4. **Overview split.** `ProfileOverview` narrative (about, highlights,
   activity) beside `ProfileStatusSidebar` (status, dates, manager, flags)
   in a `lg:grid-cols-[minmax(0,1fr)_auto_18rem]` split with a vertical
   separator. Story left, facts right.
5. **Detail sections.** Personal, employment, compensation, time-off, and
   documents panels render per tab with definition rows and document cards.

## Composition

`route.tsx` owns breadcrumb, header, and tabs; panels own their rows:

```text
Page (data-content-padding="false", inner px-4 md:px-6)
├── Breadcrumb (dashboard / directory / name / section)
├── ProfileHeader (avatar + name + badges + actions)
└── Tabs (line variant, scrollable row)
    ├── overview: grid [1fr _ auto _ 18rem]
    │   ├── ProfileOverview + Separator + ProfileStatusSidebar
    ├── personal: PersonalDetails
    ├── employment: EmploymentDetails
    ├── compensation: (restricted panel)
    ├── time-off: TimeOffDetails
    └── documents: ProfileDocuments
```

- `profile-data.ts` holds the typed demo profile; derived products load it
  from a server query behind the same shape.
- Tab row scrolls horizontally (`scrollbar-none touch-pan-x overflow-x-auto`)
  with non-shrinking triggers on narrow screens.
- The lock affordance (`LockKeyhole`) marks restricted sections such as
  compensation; locked tabs explain instead of rendering.
- Document rows pair name, type badge, date, and download or view action.

## Widgets and tokens

| Widget | Primitives | Notes |
| --- | --- | --- |
| `ProfileHeader` | `avatar`, `badge`, `button` | Identity plus status badges and actions |
| `ProfileOverview` | `card`, `separator` | Narrative blocks with labelled rows |
| `ProfileStatusSidebar` | `card`, `badge`, `separator` | Facts: status, team, dates, flags |
| `PersonalDetails` | definition rows | Labelled values with copy where useful |
| `EmploymentDetails` | definition rows, `badge` | Role, team, manager, history |
| `TimeOffDetails` | `card`, `badge`, `progress` | Balances with used-versus-allowed text |
| `ProfileDocuments` | `card`, `button`, `badge` | Document rows with type and actions |

- Semantic tokens only; status meaning travels in badge text plus variant.
- Definition rows use real `dt`/`dd` or labelled equivalents for screen
  readers.
- Dates use absolute formats with locale from server-passed values.
- Sensitive rows (compensation, identifiers) mask by default with a reveal
  action gated by permission.

## Required states

- Loading: skeleton header plus tab placeholders; tab row stays mounted.
- Missing sections: panels explain absence ("No documents on file") with
  an upload or request action where permitted.
- Restricted section: locked panel names the requirement and the contact,
  never a blank tab.
- Error: per-panel error with retry; header never blanks for panel failure.
- Permission denied: masked values with explanation; actions hide per role.
- Overflow: long names, titles, and document names truncate; full value on
  hover.
- Viewports: overview stacks (narrative above sidebar) below `lg`; tabs
  scroll; header wraps actions.
- Themes: avatar fallbacks, badges, and separators verified in both modes.

## SSR notes

- `route.tsx` is SSR-safe; the profile renders from server-provided props
  or a loader keyed by the record id.
- Tab state is local (`defaultValue`) in the source; promote to search
  params only when linking to a section matters.
- Sensitive panels check permission on the server and render locked states
  without leaking values into props.
- Document downloads go through authorized handlers, never raw hrefs to
  storage.
- Avatar images carry `alt` text; fallbacks render initials on the server.

## Snippet (SSR-safe)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { profile } from "./-components/profile-data";
import { ProfileHeader } from "./-components/profile-header";
import { ProfileOverview } from "./-components/profile-overview";
import { ProfileStatusSidebar } from "./-components/profile-status-sidebar";

export const Route = createFileRoute("/(main)/dashboard/profile")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-4 py-4" data-content-padding="false">
      {/* breadcrumb */}
      <ProfileHeader profile={profile} />
      <Tabs className="min-h-0 flex-1 gap-0" defaultValue="overview">
        {/* scrollable line-variant tab row */}
        <div className="px-4 md:px-6">
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_auto_18rem]">
              <div className="py-4 lg:pr-6">
                <ProfileOverview profile={profile} />
              </div>
              {/* vertical separator */}
              <div className="py-4 lg:pl-6">
                <ProfileStatusSidebar profile={profile} />
              </div>
            </div>
          </TabsContent>
          {/* personal, employment, compensation, time-off, documents */}
        </div>
      </Tabs>
    </div>
  );
}
```

## Allowed deviations

- Rename tabs to the product's person model; keep six or fewer sections.
- Replace the status sidebar facts with the product's key attributes; keep
  the narrative-left, facts-right split.
- Gate sensitive tabs server-side; locked states explain, never blank.
- Promote the active tab to search params when sections must be linkable.
- Add person actions (message, schedule, export) in the header only beside
  real capability.
- Promote person primitives to shared code only after a second record type
  consumes them.
