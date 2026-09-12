# Composition matrix

How to combine canonical capsules when one screen answers two needs. Pick one
base capsule for the information hierarchy, then graft at most two focused
widgets from other capsules. Resolve base and grafts via
`docs/ai/capsule-map.yaml` (maximum two capsules per task).

## Precedence rule

1. The base capsule owns the page skeleton: header, section order, grid, and
   responsive collapse. Never merge two skeletons.
2. Grafts are single widgets (a panel, a toolbar control, a table), never a
   second page order. A graft adapts to the base grid and tokens.
3. When base and graft disagree on a pattern (tabs versus single scroll,
   table versus board), the base wins. Record the decision as an intentional
   deviation.
4. Shared state (scope selects, search params) lives at the base route level;
   grafts receive filtered props. No graft owns URL state the base does not
   know about.
5. If three or more capsules feel necessary, the screen is two screens. Split
   it instead of composing.

| Need | Base | Grafts (max 2) |
| --- | --- | --- |
| Store overview with support conversations | ecommerce-dashboard | Chat thread panel in the rail; mail reply action on orders |
| Pipeline review with scheduling | crm-dashboard | Calendar agenda panel beside reminders; tasks table for follow-ups |
| Operations status with incident chat | infrastructure-dashboard | Chat thread scoped to the incident; tasks queue for remediation |
| Finance review with document output | finance-dashboard | Invoice paper preview for statements; file list for receipts |
| Team planning with assignment board | productivity-dashboard | Kanban column strip for active sprint; calendar panel for the week |
| Cohort review with member records | academy-dashboard | Profile header graft for standout students; tasks list for grading |
| Building overview with file evidence | default-dashboard | File grid panel for reports; mail composer for announcements |
| Applicant tracking with role context | tasks-collection | Roles scope badges on rows; profile header in row detail |
| Vendor directory with order history | users-management | Ecommerce orders table grafted per vendor; file list for contracts |
| Shipment exceptions with owner follow-up | logistics-tracking | Tasks panel for exception owners; chat thread per delayed shipment |
