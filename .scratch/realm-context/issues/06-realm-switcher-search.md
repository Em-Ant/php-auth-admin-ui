# 06 — Realm switcher search

- **Status:** Todo
- **Depends on:** 01 (options catalog), 03 (switcher in the shell)
- **Blocks:** —

## Context

Default resolution and the realm switcher read the full
`GET /admin/realms/options` catalog (issue 01), so the 200-row `limit` cap no
longer truncates the options. This issue is only the *search* affordance on top:
`UsersController` and `ClientsController` already accept `q`; `RealmsController`
and `RolesController` do not. The paginated `GET /admin/realms` list is what the
Realms table shows, so `q` narrows the table (and any future server-backed realm
picker) without touching the options catalog.

## Scope

- **Server:** add a `q` search to `GET /admin/realms`, mirroring
  `UsersController::list` and `ClientsController::list` — bind the escaped
  prefix through `searchTerm`, extend `RealmRepository::searchAll` with the
  optional term, order and page unchanged. (See `REALM-CONTEXT-SERVER-PLAN.md`.)
- **Frontend:** add a search input to the Realms page that round-trips through
  the URL search params, matching the existing `q` pattern on users/clients.

## Acceptance criteria

- Searching realms narrows the table server-side; clearing it restores the full
  page.
- No client-side truncation of the realm list beyond what the user asked for.
- Empty-search behaviour matches the users/clients screens.

## Tests

- Server integration: `q` filters by prefix, escapes `%`/`_`, and pages
  correctly.
- Frontend: typing in the switcher updates the URL and the visible rows.

## Out of scope

Adding search to roles or the other catalogs (separate follow-up if needed).
