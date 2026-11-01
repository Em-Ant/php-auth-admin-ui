# 02 — Replace user/client/role filter selects with the picker

- **Status:** Todo
- **Depends on:** 01
- **Blocks:** —

## Context

With the picker in place, every unbounded selector can be swapped. Realm
selectors leave these screens in realm-context issue 05, so this issue only
touches the user/client/role ones.

## Scope

### Toolbar filters

- `src/pages/sessions/Sessions.tsx` — User → `EntityPicker`.
- `src/pages/offline-sessions/OfflineSessions.tsx` — User and Client →
  `EntityPicker`.
- `src/pages/logins/Logins.tsx` — Client → `EntityPicker`.
- `src/pages/roles/Roles.tsx` — Client → `EntityPicker`.

URL params are unchanged (`user_id`, `client_id`); the picker only chooses the
value and the existing `updateParams` call stays.

### Dialogs

- `src/pages/sessions/SessionsDialogs.tsx` — User and Client → `EntityPicker`.
- `src/pages/users/UserDialogs.tsx` — assign-role Role → `EntityPicker`
  (realm-scoped).
- `src/pages/roles/RoleDialogs.tsx` — optional Client → `EntityPicker`.
- `src/pages/clients/ClientDialogs.tsx` — scope-to-role Role → `EntityPicker`
  (scoped to the current client via `searchRoles({ client_id, q })`). Scope
  stays on `EntitySelect` (bounded set).

### Catalog preloads

- Drop the `fetchUsers` / `fetchClients` catalog dispatches in
  `src/app/routes.tsx` that existed only to fill these selects. Keep the realm
  catalog (and the client catalog wherever a select still needs it, if the realm
  -context work has not yet removed it). Confirm no select loses its source.

### Complementary navigation

- On `src/pages/users/UserDetail.tsx`, add “Sessions” and “Offline sessions”
  links that navigate to those lists pre-filtered by `user_id` — the Keycloak
  user → sessions investigation path in one click. Skip Logins (per-client/session
  rather than per-user).

## Acceptance criteria

- A user/client/role that is not in the first 200 rows is selectable on every
  swapped screen.
- Selecting and clearing a picker updates the URL param and narrows/restores the
  list exactly as the old select did.
- A deep link carrying `user_id`/`client_id`/`role_id` shows the entity's label,
  not an id.
- Opening the Sessions/Offline-sessions links from a user lands on the list
  filtered to that user.

## Tests

- Integration (Testing Library + `user-event`, ADR-0004): type a query, pick a
  result, assert the request carries the realm scope and the URL param updates;
  the empty and error states; the deep-link label.
- Update existing tests that selected from a preloaded catalog to drive the
  picker instead.

## Out of scope

Roles `q` server support (issue 03); realm selectors (realm-context issue 05).
