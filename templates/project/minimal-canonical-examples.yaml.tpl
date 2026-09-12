schemaVersion: 1
    
# Minimal profile contract: `path` appears only when the example's source
# code still exists in this project. Capsule-only examples carry `capsule`
# without `path`, so agents never trust a source route that was removed by
# the minimal profile. Resolve knowledge via docs/ai/capsule-map.yaml.
    
selectionRules:
  - Resolve capsules via docs/ai/capsule-map.yaml first using trigger keywords.
  - A path key means the source route exists here; its absence means capsule-only.
  - Use the default dashboard for shell, spacing, and theme behavior.
  - Add a canonical example only after it is current, reusable, and verified.
  - Record intentional deviations from the selected example.
  - Never use routes under "(legacy)" for new development.
    
examples:
  default-dashboard:
    path: src/routes/(main)/dashboard/default
    capsule: docs/patterns/canonical/default.md
    useFor:
      - baseline dashboard shell
      - neutral theme composition
      - general overview layout
    status: current
    
  finance-dashboard:
    capsule: docs/patterns/canonical/finance.md
    useFor:
      - financial KPI hierarchy
      - dense dashboard composition
      - chart and metric layout
    status: capsule
    
  infrastructure-dashboard:
    capsule: docs/patterns/canonical/infrastructure.md
    useFor:
      - operational status
      - resource and health presentation
      - technical metric grouping
    status: capsule
    
  crm-dashboard:
    capsule: docs/patterns/canonical/crm.md
    useFor:
      - customer and pipeline hierarchy
      - business activity composition
      - CRM-oriented widgets
    status: capsule
    
  analytics-dashboard:
    capsule: docs/patterns/canonical/analytics.md
    useFor:
      - trend visualization
      - chart-heavy responsive layout
      - analytics composition
    status: capsule
    
  users-management:
    capsule: docs/patterns/canonical/users.md
    useFor:
      - entity list
      - user-management information architecture
      - table and action composition
    status: capsule
    
  roles-management:
    capsule: docs/patterns/canonical/roles.md
    useFor:
      - permissions-oriented UI
      - role list and actions
      - access-management composition
    status: capsule
    
  academy-dashboard:
    capsule: docs/patterns/canonical/academy.md
    useFor:
      - cohort and class overview
      - schedule plus performance composition
      - staff action hierarchy
    status: capsule
    
  calendar-screen:
    capsule: docs/patterns/canonical/calendar.md
    useFor:
      - full scheduling surface
      - event grid and detail composition
      - view-switching toolbar
    status: capsule
    
  chat-screen:
    capsule: docs/patterns/canonical/chat.md
    useFor:
      - conversational surface
      - list plus thread composition
      - presence and composer patterns
    status: capsule
    
  coming-soon-screen:
    capsule: docs/patterns/canonical/coming-soon.md
    useFor:
      - unreleased route placeholder
      - centered static composition
    status: capsule
    
  ecommerce-dashboard:
    capsule: docs/patterns/canonical/ecommerce.md
    useFor:
      - storefront overview
      - scoped KPI and orders composition
      - merchandising panels
    status: capsule
    
  file-manager-screen:
    capsule: docs/patterns/canonical/file-manager.md
    useFor:
      - file and folder library
      - grid versus list composition
      - search-param view state
    status: capsule
    
  invoice-composer:
    capsule: docs/patterns/canonical/invoice.md
    useFor:
      - document composer with live preview
      - form plus paper composition
      - line-item editing
    status: capsule
    
  kanban-board:
    capsule: docs/patterns/canonical/kanban.md
    useFor:
      - drag-and-drop status board
      - column and card composition
      - keyboard-equivalent moves
    status: capsule
    
  logistics-tracking:
    capsule: docs/patterns/canonical/logistics.md
    useFor:
      - shipment tracking
      - list plus detail plus map composition
      - exception surfacing
    status: capsule
    
  mail-screen:
    capsule: docs/patterns/canonical/mail.md
    useFor:
      - inbox with reading pane
      - folder triage composition
      - persisted layout
    status: capsule
    
  patient-monitoring-screen:
    capsule: docs/patterns/canonical/patient-monitoring.md
    useFor:
      - realtime telemetry wall
      - card grid plus detail composition
      - alarm and disconnect states
    status: capsule
    
  productivity-dashboard:
    capsule: docs/patterns/canonical/productivity.md
    useFor:
      - personal planning workspace
      - work column plus ritual rail
      - task and focus composition
    status: capsule
    
  profile-record:
    capsule: docs/patterns/canonical/profile.md
    useFor:
      - per-person record
      - header plus tabbed detail composition
      - status sidebar pattern
    status: capsule
    
  tasks-collection:
    capsule: docs/patterns/canonical/tasks.md
    useFor:
      - triage queue with faceted filters
      - toolbar plus table composition
      - bulk action patterns
    status: capsule

protectedExamples:
  ui-primitives:
    path: src/components/ui
    rule: inspect-and-compose-do-not-feature-customize

  calendar-primitives:
    path: src/components/calendar
    rule: inspect-and-compose-do-not-feature-customize

deprecated: []
