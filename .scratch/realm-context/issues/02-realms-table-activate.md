# 02 — Realms table: activate control and Active pill

- **Status:** Todo
- **Depends on:** 01
- **Blocks:** —

## Context

The Realms page (`src/pages/realms/Realms.tsx`) is where the switcher lives.
Activating must **mark the realm active and stay on the page** — it does not
navigate.

## Scope

- Add a trailing "Active" column to the realms table.
- The active row renders a `Badge` "Active" (with a check icon) instead of a
  button.
- Every other row renders an `Activate` button:
  - `variant="outline" size="sm"`, visible text `Activate`.
  - `aria-label={`Activate realm ${realm.name}`}` so tests and screen readers can
    target one row (the visible "Activate" is contained in the accessible name,
    satisfying label-in-name).
  - `onClick` dispatches `setActiveRealm({ id: realm.id, name: realm.name })`.
    No `navigate`.

## Acceptance criteria

- Activating a row moves the `Active` pill to it and removes it from any previous
  row.
- The page does not navigate after activating.
- Keyboard: the Activate button is reachable by Tab and activatable with
  Enter/Space.
- The active row is understandable without color alone (pill text, not just a
  background).

## Tests

- Extend `src/pages/realms/Realms.test.tsx`: render, activate a non-active row,
  assert the pill moved and the route is unchanged.

## Out of scope

The shell pill (issue 03) and routing (issue 04).
