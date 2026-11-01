# 03 — Shell active-realm pill

- **Status:** Todo
- **Depends on:** 01
- **Blocks:** —

## Context

The active realm must be visible on every screen, not only on the Realms page.

## Scope

- In `src/app/layout/Layout.tsx`, `SidebarHeader`, show the active realm next to
  the "Admin UI" title as a `Badge variant="secondary"` with a `Globe` icon.
  Replace the current "php-auth dashboard" subtitle with the realm pill, or add
  it as a third line — whichever keeps the collapsed sidebar readable.
- Read `selectActiveRealmName` from the store (primitive selector).
- Before the default is resolved, render a neutral placeholder (e.g. a muted
  `…`), never an empty box that shifts layout.
- In the collapsed (icon) sidebar, expose the realm name through the button
  `tooltip` and an `aria-label` so it is not lost.

## Acceptance criteria

- The pill shows the active realm name and updates when a realm is activated on
  the Realms page.
- The name is available to assistive tech when the sidebar is collapsed.
- No layout shift on first paint while the realm is resolving.

## Tests

- Add/extend a Layout test: render with providers, assert the pill text; change
  the slice value and assert it updates.

## Out of scope

Routing (issue 04).
