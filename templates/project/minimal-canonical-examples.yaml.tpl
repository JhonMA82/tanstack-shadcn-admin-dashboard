schemaVersion: 1

selectionRules:
  - Use the default dashboard for shell, spacing, and theme behavior.
  - Add a canonical example only after it is current, reusable, and verified.
  - Record intentional deviations from the selected example.
  - Never use routes under "(legacy)" for new development.

examples:
  default-dashboard:
    path: src/routes/(main)/dashboard/default
    useFor:
      - baseline dashboard shell
      - neutral theme composition
      - general overview layout
    status: current

protectedExamples:
  ui-primitives:
    path: src/components/ui
    rule: inspect-and-compose-do-not-feature-customize

  calendar-primitives:
    path: src/components/calendar
    rule: inspect-and-compose-do-not-feature-customize

deprecated: []
