# 01 — Active realm state slice

- **Status:** Todo
- **Depends on:** —
- **Blocks:** 02, 03, 04

## Context

The active realm needs one owner. Per ADR-0003 it is app-layer session/context
state (like `app/model/operator` and `app/model/theme`), not an entity, because
it is not administered data.

## Scope

Create `src/app/model/realm/` mirroring `app/model/operator`:

- `slice.ts` — state `{ id: string | null; name: string | null }`; reducers
  `setActiveRealm({ id, name })` and `clearActiveRealm()`. Initial state is
  restored from `localStorage` (key `activeRealm`, JSON).
- `selectors.ts` — `selectActiveRealmId` and `selectActiveRealmName`, both
  primitives (ADR-0003).
- `index.ts` — public entry.
- Persist on change the way `useTheme` persists the theme, or via a listener
  registered from `app/store` (ADR-0003 store rules).

Default resolution:

- When no stored realm exists, or the stored realm is no longer in the list,
  resolve the realm whose `name === config.auth.realm` (default `admin`) and
  store `{ id, name }`.
- Cross-slice reads go in a thunk, not at the dispatch site: a
  `resolveActiveRealm` thunk reads the realms list through
  `selectRealmsItems` and dispatches `setActiveRealm`. It may also run as a
  listener on `fetchRealms.fulfilled`.

## Acceptance criteria

- Fresh load with no stored realm ends up with `admin` active once realms load.
- A stored realm that still exists is kept; one that no longer exists falls back
  to `admin`.
- Selectors return primitives; no object literals in selector bodies.
- No React or React Router import in the slice.

## Tests

- `src/app/model/realm/slice.test.ts`: `setActiveRealm`, `clearActiveRealm`,
  restore from storage.
- Default resolution: admin fixture resolves; unknown stored id falls back.

## Out of scope

Routing and UI (issues 02–04).
