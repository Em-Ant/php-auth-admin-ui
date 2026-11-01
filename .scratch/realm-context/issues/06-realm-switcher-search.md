# 06 — Realm switcher search and catalog limit

- **Status:** Todo
- **Depends on:** —
- **Blocks:** —

## Context

Dropdown options are preloaded at `CATALOG_LIMIT = 200`
(`src/app/routes.tsx`), and the server caps `limit` at 200
(`ValidatesAdminInput::paginationFromQuery`, values over the cap fall back to
50). Today that affects every realm/client/user filter. After realm scoping
(issue 05) the realm switcher is the only screen that still needs the full realm
list, so this is where the ceiling matters.

`UsersController` and `ClientsController` already accept `q`; `RealmsController`
and `RolesController` do not.

## Scope

- **Server:** add a `q` search to `GET /admin/realms`, mirroring
  `UsersController::list` and `ClientsController::list` — bind the escaped
  prefix through `searchTerm`, extend `RealmRepository::searchAll` with the
  optional term, order and page unchanged.
- **Frontend:** add a search input to the Realms page (the switcher) that
  round-trips through the URL search params, matching the existing `q` pattern on
  users/clients.
- Optional, only if realms can realistically exceed 200: a lightweight
  `GET /admin/realms/options` returning all `{ id, name }` for the switcher.

## Acceptance criteria

- Searching realms narrows the table/switcher server-side; clearing it restores
  the full page.
- No client-side truncation of the realm list beyond what the user asked for.
- Empty-search behaviour matches the users/clients screens.

## Tests

- Server integration: `q` filters by prefix, escapes `%`/`_`, and pages
  correctly.
- Frontend: typing in the switcher updates the URL and the visible rows.

## Out of scope

Adding search to roles or the other catalogs (separate follow-up if needed).
