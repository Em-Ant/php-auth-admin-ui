# 03 — Add q search to roles (server)

- **Status:** Todo
- **Depends on:** —
- **Blocks:** —

## Context

The role picker (issues 01–02) searches server-side only if `GET /admin/roles`
accepts `q`. It does not today: `RolesController::list` forwards only `realm_id`
and `client_id`, and `RoleRepository::searchAll` has no search term. Users and
clients already have this, so roles are the odd one out.

Server repo: `/home/emanuele/Desktop/php_auth_server`.

## Scope

- **Controller** (`src/Controllers/Admin/RolesController.php`): read the `q`
  search term the same way `UsersController::list` and `ClientsController::list`
  do, and pass it to `searchAll`.
- **Repository** (`src/Repositories/RoleRepository.php`): extend
  `searchAll(?string $realmId, ?string $clientId, int $limit, int $offset)` with
  an optional `?string $q`, adding `AND name LIKE :q ESCAPE '\'` to the existing
  `WHERE`, with the escaped prefix bound as a parameter. Keep the `ORDER BY name`
  and paging unchanged, and keep the `COUNT(*) OVER()` total accurate.
- Follow the existing escaping helper used by users/clients so `%` and `_` are
  literal.
- **Optional index:** an index supporting `(realm_id, name)` and
  `(client_id, name)` already exists (migration 011). Add a generic `name` index
  only if a query plan shows a scan on the client-scoped path; otherwise skip.

## Acceptance criteria

- `GET /admin/roles?q=adm` returns only roles whose name starts with `adm`.
- `q` composes with `realm_id` and `client_id`.
- `%` and `_` in `q` are treated literally.
- Pagination and `total` remain correct with and without `q`.
- No behavior change when `q` is absent.

## Tests

- Server integration: prefix filtering, `%`/`_` escaping, composition with
  `realm_id`/`client_id`, and paging.
- Frontend (optional, in this repo): assert `listRoles` forwards `q` once the
  picker passes it.

## Out of scope

Search on realms (realm-context issue 06); full-text search or `q` on the
session/logins/offline-session endpoints.
