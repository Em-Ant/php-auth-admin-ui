# 05 — Loaders pass realm_id; drop realm selectors

- **Status:** Todo
- **Depends on:** 04
- **Blocks:** —

## Context

Once routes carry the realm, the realm should flow from the URL into every
scoped fetch, and the per-screen Realm UI should disappear.

## Scope

- **Loaders** (`src/app/routes.tsx`): each scoped loader reads `params.realmId`
  and passes `realm_id` into `fetchClients`, `fetchUsers`, `fetchRoles`,
  `fetchSessions`, `fetchLogins`, `fetchOfflineSessions`, `fetchAuditLogs`.
- **Params** (`src/pages/*/params.ts`): drop `realm_id` from the list params and
  from the URL search params — it is now a path segment. Remove
  `readBoundedInt`/filter handling for it.
- **Toolbars:** remove the Realm `EntitySelect` from `Clients.tsx`, `Users.tsx`,
  `Roles.tsx`, `Sessions.tsx`, `Logins.tsx`, `OfflineSessions.tsx`,
  `AuditLogs.tsx`. The remaining filter `EntitySelect`s (User, Client, Action,
  Actor, Target) stay.
- **Dialogs:** remove the Realm field from `ClientDialogs`, `UserDialogs` and
  `RoleDialogs`; the create/update payload takes `realm_id` from the active
  realm. Keep the realm-scoped Client selector in `RoleDialogs`.
- **Audit logs:** apply the PRD open question — hide `realm_id = NULL` entries in
  the realm view or add a separate "Global" view.
- **Catalog preloads:** the loaders currently also fetch realms/clients/users at
  `CATALOG_LIMIT` for the remaining selectors. Keep only the catalogs the screen
  still needs, now realm-scoped.

## Acceptance criteria

- No screen fetches another realm's clients/users/roles/sessions/logins/audit
  entries.
- No Realm select remains in a toolbar or create/edit dialog.
- Creating a client/user/role sets `realm_id` from the active realm without a
  user choice.

## Tests

- Update integration tests to drop the realm selection step and assert the
  create payload carries the active realm.
- Assert the remaining filters still narrow results within the realm.

## Out of scope

Server-side authorization (issue 07).
