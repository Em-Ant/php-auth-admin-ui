# 0006 — Per-realm authorization: global admin retained

- **Status:** Accepted
- **Date:** 2026-11-21
- **Related:** ADR-0005 (active realm context)

## Context

ADR-0005 makes the Realm a first-class navigation context: scoped screens live
under `/:realmId/...`, loaders send `realm_id`, and the shell shows the active
realm everywhere. That changes how the admin UI *feels*, but not what the server
*allows*.

`AdminAuthMiddleware` grants access when the token's `realm_access.roles`
contains the global `admin` role. It does not inspect the target realm, and
every admin route accepts any realm id. A realm-first UI therefore risks
looking like a security boundary while none exists: an operator scoped to one
realm in the sidebar can still call the API for another.

Issue 07 of the realm-context feature asked for an explicit decision rather than
leaving this implicit.

## Options considered

1. **Keep global admin.** Realm scoping stays a UX convenience. Smallest change;
   matches the current server and every existing deployment. The documentation
   must say plainly that it is not a boundary.
2. **Realm-scoped admin roles.** An operator carries roles or an allow-list per
   realm, and the server rejects reads and writes outside them. This requires
   changes to `AdminAuthMiddleware`, the operator's claims, the realm list the
   operator may see, and the admin UI's error handling — a separate feature with
   its own migration and threat model.

## Decision

**Option 1: keep the global `admin` role.** The active realm is a navigation
and request-scoping context, not an authorization boundary.

- The server remains the only authority for access decisions. Realm scoping in
  the UI is correctness and usability: it prevents accidental cross-realm edits
  and keeps lists meaningful.
- No server, claim or middleware change is made by the realm-context feature.
- The limitation is stated in the README, `CONTEXT.md` (Active realm) and
  ADR-0005, so a reader cannot mistake the active realm for a permission.
- Tests may assert that a scoped loader sends `realm_id`, but they must not
  describe that as an access-control guarantee.

## Consequences

- Any operator holding the global `admin` role can read or write every realm,
  including through a hand-crafted API call; the UI does not and cannot prevent
  it.
- Realm-first navigation can ship without a backend migration, and existing
  operators keep working unchanged.
- If per-realm operators become a requirement, option 2 ships separately: it
  needs its own ADR and feature breakdown, not an extension of this one.
- The UI must keep its wording honest — "active realm", not "permitted realm".

## Revisit when

Operators from different realms must be isolated from one another, an audit
requirement demands per-realm access control, or the admin API starts serving
non-global-admin callers.