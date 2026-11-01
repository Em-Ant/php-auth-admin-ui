# PRD — Active realm context (realm-first admin UI)

## Problem

The dashboard flattens the auth server's hard isolation boundary. Every screen
shows all realms at once, and each list toolbar and create dialog carries its own
Realm selector. Those selectors are fed by catalog preloads capped at 200
options (`CATALOG_LIMIT` in `src/app/routes.tsx`; the server caps `limit` at 200
too), so past that number the remaining realms are silently unselectable. The
same ceiling limits the client/user/role selectors inside dialogs.

## Goal

Make the Realm a navigation context, the way Keycloak's admin console does:
choose a realm on the Realms page, then operate the rest of the UI inside it. The
active realm is visible everywhere, survives reload, and drives every scoped
request.

## Decisions

- **Where the switcher lives:** the Realms page (`/realms`), not the shell.
- **Default realm:** `admin` (the operator realm, `config.auth.realm`), resolved
  from the realm list.
- **Activate behaviour:** mark the realm active and **stay on the Realms page**;
  the next navigation lands inside the chosen realm.
- **Markers (both):** an `Active` pill on the realm table row, and a pill next to
  "Admin UI" in the sidebar header so the context is visible on every screen.
- **Scope of this plan:** the whole realm-first refactor, broken into shippable
  issues. Issues 01–03 deliver the switcher and state without route changes;
  04–05 wire the context through routing and loaders.

## Non-goals

- Per-realm authorization. The active realm is a UI context, not a security
  boundary; the admin role is still global. Authorization is a server-side
  decision (see issue 07 note).
- Realm switcher pagination. Realms are expected to stay few; a `q` search is the
  fallback (issue 06).
- Changing the auth flow. The operator still signs into the `admin` realm.

## Phases

1. **Context only (01–03).** New `app/model/realm` slice with default-admin
   resolution and persistence; Activate control and `Active` pill on the Realms
   page; shell pill in the sidebar header. No route changes yet — the active
   realm is a marker that later phases consume.
2. **Wire it through routing (04).** Realm-scoped routes `/:realmId/...`, a
   `/:realmId` guard, dynamic sidebar links, and landing resolution.
3. **Consume it (05).** Loaders pass `realm_id`; remove the Realm filter from
   toolbars and the Realm field from dialogs.
4. **Harden (06–07).** Optional realm search for the switcher; per-realm
   authorization decision recorded, not implemented.

## Open questions

- **Audit entries with `realm_id = NULL`.** Hide them in the realm view, or add a
  separate "Global" audit view? Default if unresolved: a separate view.
- **Landing route.** Should `/` redirect to `/:defaultRealmId/overview`, or keep
  `/overview` global and only set the context? Recommend the former once routes
  are scoped.
- **Glossary.** Add an **Active realm** entry to `CONTEXT.md` when 01 lands.

## Related documents

- ADR-0005 (`docs/adr/0005-active-realm-context.md`) — the decision.
- ADR-0001 (FSD), ADR-0002 (routing), ADR-0003 (state), ADR-0004 (testing).
- **Entity search** (`.scratch/entity-search/PRD.md`) — the companion feature
  that replaces the high-cardinality user/client/role selects with server-backed
  async pickers. Realm selectors are removed here (issue 05); user/client/role
  selectors are replaced there. Issue 06 (realm `q`) stays in this feature.

## Issues

- [01 — Active realm state slice](issues/01-active-realm-slice.md)
- [02 — Realms table: activate control and Active pill](issues/02-realms-table-activate.md)
- [03 — Shell active-realm pill](issues/03-shell-active-realm-pill.md)
- [04 — Realm-scoped routes and navigation](issues/04-realm-scoped-routes.md)
- [05 — Loaders pass realm_id; drop realm selectors](issues/05-loaders-realm-scoping.md)
- [06 — Realm switcher search and catalog limit](issues/06-realm-switcher-search.md)
- [07 — Per-realm authorization (decision)](issues/07-per-realm-authorization.md)
