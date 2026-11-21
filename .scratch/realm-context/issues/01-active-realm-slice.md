# 01 — Active realm state slice

- **Status:** Done
- **Depends on:** —
- **Blocks:** 02, 03, 04

## Context

The active realm needs one owner. Per ADR-0003 it is app-layer session/context
state (like `app/model/operator` and `app/model/theme`), not an entity, because
it is not administered data. The realm *catalog* it resolves against is server
data and belongs to `entities/realms`.

## Scope

**Realm options read** (`entities/realms`): the backend exposes
`GET /admin/realms/options` (all realms as `{ id, name }`, unpaginated). Add
`listRealmOptions`/`fetchRealmOptions`, an `options` field and
`selectRealmOptions` to the entity slice. Default resolution and the later
`:realmId` guard read this catalog, never the 200-capped list.

Create `src/app/model/realm/` mirroring `app/model/operator`:

- `slice.ts` — state `{ id: string | null; name: string | null }`; reducers
  `setActiveRealm({ id, name })` and `clearActiveRealm()`. Initial state is
  restored from `localStorage` (key `activeRealm`, JSON).
- `selectors.ts` — `selectActiveRealmId` and `selectActiveRealmName`, both
  primitives (ADR-0003).
- `storage.ts` — read/write/clear of the persisted record.
- `resolve.ts` — `resolveActiveRealm` thunk and the pure `pickDefaultRealm`
  policy; the cross-slice read of the catalog lives here (ADR-0003).
- `listeners.ts` — persist on `setActiveRealm`/`clearActiveRealm`; resolve the
  default when `fetchRealmOptions.fulfilled` lands; clear the context when the
  active realm is deleted.
- `index.ts` — public entry.

Default resolution:

- When no stored realm exists, or the stored realm is no longer in the options
  catalog, resolve the realm whose `name === config.auth.realm` (default
  `admin`) and store `{ id, name }`.
- Cross-slice reads go in the thunk, not at the dispatch site: `resolveActiveRealm`
  reads the catalog through `selectRealmOptions` and dispatches `setActiveRealm`.
- The Realms loader dispatches `fetchRealmOptions`; resolution runs on its
  `fulfilled` action, so a fresh load or a post-delete reload re-resolves.

## Acceptance criteria

- Fresh load with no stored realm ends up with `admin` active once the options
  catalog loads.
- A stored realm that still exists is kept; one that no longer exists falls back
  to `admin`.
- Selectors return primitives; no object literals in selector bodies.
- No React or React Router import in the slice.

## Tests

- `src/app/model/realm/slice.test.ts`: `setActiveRealm`, `clearActiveRealm`,
  storage round-trip and corrupt-storage fallback.
- `src/app/model/realm/resolve.test.ts`: `pickDefaultRealm` policy; admin fixture
  resolves; a stored realm that exists is kept; an unknown stored id falls back.
- `src/entities/realms`: options thunk/selector and the `/realms/options` client.

## Out of scope

Routing and UI (issues 02–04).
