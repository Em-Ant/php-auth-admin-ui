# PRD — Async entity search (replace preloaded filter catalogs)

## Problem

Realm is bounded, but users, clients and roles are not. Every one of them is
rendered today as a preloaded `<select>` (`widgets/entity-select/EntitySelect`)
fed by a catalog fetched at `CATALOG_LIMIT = 200` in `src/app/routes.tsx`. Past
200 rows the remaining entries are **silently unselectable**, so an operator
cannot filter Sessions by a specific user, or Logins by a specific client, once
the realm is large.

Raising the cap is not a fix: the server caps `limit` at 200 as well, and values
over the cap fall back to 50 (`ValidatesAdminInput::paginationFromQuery`), so the
list is wrong in the other direction. Preloading an unbounded set is the wrong
model.

## Goal

Replace the preloaded selects for **high-cardinality** entities with a reusable,
server-backed async picker, so any user/client/role is selectable regardless of
count, while realm selectors stay simple preloaded lists.

## What the server already gives us

`GET /admin/users` and `GET /admin/clients` already accept a realm-scoped `q`
(prefix `term%`, using the existing indexes), and every downstream list already
filters by the resulting id:

| Endpoint | `q` matches | Index |
|---|---|---|
| `/admin/users` | `email`, `name` | `idx_users_realm_email`, `idx_users_name` |
| `/admin/clients` | `name`, `uri` | `idx_clients_realm_name` |
| `/admin/roles` | **none yet** | `(realm_id, name)`, `(client_id, name)` |
| `/admin/realms` | **none yet** (realm-context issue 06) | — |

So no full-text search over sessions or logins is needed: pick the user/client
id, and the existing `user_id` / `client_id` filters do the rest.

## Decisions

- **Reached by search, not by preload.** Users, clients and roles are chosen
  through server-side search; the full list is never preloaded for a picker.
- **Bounded entities keep the simple select.** Realms, audit Action/Actor/Target
  (static enums) and scope strings stay on `EntitySelect`.
- **Search state lives in the entity slice**, not component state (ADR-0003):
  `entities/users`, `entities/clients`, `entities/roles` each gain
  `searchItems`/`searchStatus`/`searchRequestId` and a `search*` thunk, kept
  **separate from the list `items`** so a typeahead never overwrites the table.
  A `requestId` guard drops stale responses.
- **`shared/ui/combobox` is presentational only** (no domain). A
  `widgets/entity-picker` composes it with a `search(q)` adapter supplied by the
  page, so the widget stays domain-agnostic and the page keeps the realm scope.
- **A deep-linked id resolves its label by id.** When `user_id`/`client_id`
  arrives in the URL and is not in the first result page, the picker hydrates the
  label with `getUserById`/`getClient`/`getRole`. It never assumes membership in
  the visible results.
- **URL params do not change.** `user_id`, `client_id` and `role_id` already
  exist; the picker chooses the value.

## Non-goals

- Realm search. Realms are expected to stay few and are handled by realm-context
  issue 06.
- Full-text search of sessions or logins. The id filters are sufficient.
- Changing the API pagination contract or the 200 cap.
- Any per-realm authorization (realm-context issue 07).

## Phases

1. **The picker (01).** `shared/ui/combobox` + `widgets/entity-picker` +
   per-entity search thunks/state. Ships with unit and component tests but no
   screen swapped yet.
2. **Swap the screens (02).** Replace the user/client/role selects in toolbars and
   dialogs, drop the now-dead catalog preloads, and add the UserDetail →
   Sessions/Offline-sessions shortcuts.
3. **Roles server support (03).** Add `q` to `GET /admin/roles` (and an optional
   index) so the role picker can search server-side like users and clients.

## Where the picker is needed

| Screen / dialog | Keep preloaded | Async picker |
|---|---|---|
| Sessions filter | Realm | **User** |
| Offline sessions filter | Realm | **User**, **Client** |
| Logins filter | Realm | **Client** |
| Roles filter | Realm | **Client** |
| Audit log filter | Realm, Action, Actor, Target | — |
| Users / Clients filter | Realm | — |
| Sessions “Invalidate” dialog | — | **User**, **Client** |
| User dialog → assign role | — | **Role** (realm-scoped) |
| Role dialog → client | — | **Client** (optional) |
| Client dialog → scope to role | Scope | **Role** (client-scoped) |

## Open questions

- **Result page size.** 20 per query is the working default; revisit if the
  popover feels short.
- **Preferred label.** Users currently show `name` in `EntitySelect`; the
  toolbars may prefer `email` when `name` is empty. Decide the fallback
  (`name ?? email`) when 01 lands.
- **Roles without `q` (server).** Until issue 03, the role picker searches
  client-side over its page; the picker's empty-state copy should not promise
  more than it does.

## Related documents

- Realm-first plan (`.scratch/realm-context/PRD.md`) — realm selectors removed
  there (issue 05); this feature replaces user/client/role selectors.
- ADR-0001 (FSD), ADR-0002 (routing), ADR-0003 (state), ADR-0004 (testing).

## Issues

- [01 — Async combobox and per-entity search thunks](issues/01-async-combobox.md)
- [02 — Replace user/client/role filter selects](issues/02-replace-filter-selects.md)
- [03 — Add q search to roles](issues/03-roles-q-search.md)
