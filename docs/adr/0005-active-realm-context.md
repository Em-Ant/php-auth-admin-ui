# 0005 — Active realm context

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

`CONTEXT.md` defines the Realm as "the hard isolation boundary of the auth
server. Clients, users, roles, keys and token policy all belong to exactly one
realm, and nothing crosses between realms." The API agrees: every list endpoint
already accepts `realm_id`, and `UsersController`, `ClientsController`,
`RolesController`, `SessionsController`, `LoginsController`,
`OfflineSessionsController` and `AuditLogController` filter by it.

The UI does not reflect that boundary. Every screen shows all realms at once and
each list toolbar and create dialog carries its own Realm `EntitySelect`.
Dropdown options come from catalog preloads capped at `CATALOG_LIMIT = 200`
(`src/app/routes.tsx`), and the server caps `limit` at 200 as well, so the
options are silently truncated past that.

Keycloak's admin console takes the other approach: choose a realm, then operate
the whole console inside it. This ADR records that decision for this dashboard.

## Decision

**Realm is a first-class navigation context, chosen on the Realms page and held
for the rest of the session.**

- **Scoped screens live under `/:realmId/...`.** `clients`, `users`, `roles`,
  `sessions`, `logins`, `offline-sessions` and `audit-logs` (and their detail
  routes) are realm-scoped. `realms` (the switcher and realm CRUD) and
  `overview` stay global, outside the prefix. The URL is authoritative for which
  realm a scoped screen shows (ADR-0002); the store mirrors it for the shell.
- **A new app slice `app/model/realm`** holds `{ id, name }` — mirroring
  `app/model/operator` — persisted to `localStorage`. The shell pill and the
  sidebar links read it through primitive selectors (ADR-0003). The slice is app
  layer, not an entity: it is session/context state, not administered data.
- **The default realm is the operator realm, `admin`** (`config.auth.realm`).
  When no valid stored realm exists — first load, or the stored realm was
  deleted — it is resolved from the realm list by name.
- **Activating a realm sets the context and stays on the Realms page.** The
  Activate control does not navigate. The sidebar links then resolve against the
  active realm, so the operator's next navigation lands in the chosen realm
  (Keycloak's "mark active, switch on next navigation").
- **Two markers use the same value.** The Realms table marks the active row with
  an `Active` pill and renders an `Activate` control on the others; the shell
  shows the active realm as a pill next to "Admin UI" so the context is visible
  on every screen.
- **The realm comes from context, not from a field.** The Realm filter is
  removed from every list toolbar and the Realm field is removed from the
  create/edit dialogs (`ClientDialogs`, `UserDialogs`, `RoleDialogs`); the slice
  supplies `realm_id`.
- **Realm CRUD stays global** under `/realms`. Creating a realm does not switch
  to it; deleting the active realm clears the context and re-resolves the
  default.
- **A `/:realmId` loader validates the realm.** An unknown realm id redirects to
  `/realms` (or renders not-found); a scoped loader never runs against a realm
  the operator cannot see.

### Audit entries without a realm

The `audit_logs.realm_id` column is nullable by design (migration 009 documents it as
"which realm was affected (NULL for cross-realm ops)"), but the current admin API
**never writes a NULL**: every audited write is owned by one realm, resolved by the
controller before the service logs it, and the four delete paths pass
`$existing?->getRealmId()` only after a controller `404` guard. The nullable column
that *is* exercised is `actor_id`, which is null for static-API-key writes — not
`realm_id`. A realm-scoped audit call sends `realm_id=<active>`, and
`(:realm_id IS NULL OR realm_id = :realm_id)` already excludes any NULL rows.

**Decision:** the audit view stays strictly realm-scoped. There is **no** separate
"Global" audit view. If a future cross-realm/global writer is added, it ships with
the read side it needs; a speculative `realm_id IS NULL` mode is not built now.

### Server support

Two additive, authorization-neutral read paths support this decision:

- **`GET /admin/realms`** gains a `q` prefix filter on `name` (mirroring users and
  clients) for the switcher's search.
- **`GET /admin/realms/options`** returns every realm as `{ id, name }`, sorted by
  name, with no pagination — so the switcher, default resolution and the `:realmId`
  guard never depend on the 200-row `limit` cap.

Neither adds a migration, route prefix, or per-realm authorization.

### Not in scope

- **Per-realm authorization.** Today `hasRole(ADMIN_ROLE)` grants admin
  globally; the active realm is a UI context, not a security boundary. Realm
  scoping here does not stop an admin from acting on another realm through the
  API. A per-realm authorization model is a server-side change and a separate
  decision.
- **The realm switcher never paginates.** Realms are expected to stay few; the
  switcher uses `GET /admin/realms/options` (all `{ id, name }`) so it is not
  bounded by the 200-row `limit` cap, with the `q` filter on `/admin/realms` for
  search. See *Server support*.

## Consequences

- Deep links are shareable and reload-safe: `/admin-ui/adc8cc40.../clients`
  reproduces the exact realm.
- Filters and dialogs shrink: the Realm `EntitySelect` disappears from every
  toolbar and form, and the `realm_id` and its validation leave the page params.
- `NavItem.href` stops being a static string — it becomes a function of the
  active realm. Landing on `/` must resolve a realm before the sidebar links are
  meaningful.
- In-page links follow the URL: the shell hands the active realm id to pages
  through the outlet context (`ShellOutletContext`), and pages build scoped
  targets with the shared `realmPath` helper, so they never import the app slice
  (ADR-0003). The `:realmId` layout route forwards that context, because a bare
  `<Outlet/>` resets it.
- The realm switcher is the only screen that needs the full realm list, so the
  200-option cap stops being a filter hazard for clients/users/roles.
- Integration tests that navigate bare paths (`renderRoute("/clients")`) must
  move to realm-prefixed paths, and new tests cover: default-admin resolution,
  activate-stays-put, the shell pill, unknown-realm redirect, and that a scoped
  loader passes `realm_id`.
- `CONTEXT.md` should gain an **Active realm** entry once this lands.

## Revisit when

Per-realm authorization is introduced server-side, or the number of realms grows
enough that the switcher needs server-side search or paging.
