# 04 — Realm-scoped routes and navigation

- **Status:** Todo
- **Depends on:** 01
- **Blocks:** 05

## Context

The active realm only matters if scoped screens are addressed by realm. This is
the heavy issue and may be split if it grows.

## Scope

- **Route tree** (`src/app/routes.tsx`): move realm-scoped screens under a
  `:realmId` segment — `clients`, `clients/:id`, `users`, `users/:id`, `roles`,
  `roles/:id`, `sessions`, `logins`, `offline-sessions`, `offline-sessions/:id`,
  `audit-logs`, `audit-logs/:id`. Keep `realms` and `overview` global.
- **Realm guard:** a `:realmId` layout loader validates the realm id (via the
  realms slice/API) and dispatches `setActiveRealm`, so a deep link makes the
  shell pill match. Unknown id → redirect to `/realms` (or render not-found —
  pick one and test it).
- **Landing:** `/` redirects to `/:defaultRealmId/overview` once the default is
  resolved (see the PRD open question).
- **Navigation** (`src/app/layout/navigation.ts`): `NavItem.href` becomes a
  function of the active realm, or the Layout composes `/${activeRealmId}/…`.
  "Realms" and "Overview" stay global. When no realm is active, disable scoped
  links or point them at `/realms`.
- **`isActive` / `pageTitleFor`** must compare against the realm-prefixed path.
- Keep the admin guard (ADR-0002) in front of the whole protected tree.

## Acceptance criteria

- `/clients` with no prefix redirects to `/:activeRealmId/clients` (or
  `/realms` when no realm is resolvable).
- Opening `/:realmId/clients` directly sets the active realm and shows the pill.
- An unknown realm id does not render scoped data; it redirects/404s.
- Refreshing a deep link reproduces the same realm.

## Tests

- Update every integration test that navigates a bare path to use a
  realm-prefixed path (`renderRoute` helper or a fixture realm id).
- New: deep link sets the pill and active realm; unknown realm redirects;
  landing redirect resolves the default.
- Unit: the nav href builder / `pageTitleFor` with a realm prefix.

## Out of scope

Passing `realm_id` into thunks and removing realm selectors (issue 05).
