# 07 — Per-realm authorization (decision)

- **Status:** Decision required
- **Depends on:** 04
- **Blocks:** —

## Context

Realm scoping (ADR-0005, issues 01–05) is a **UI** context only. The admin API
still authorizes on the global `admin` role: `AdminAuthMiddleware` grants access
when the token's roles contain it, and any such operator can act on any realm.
Making realm-first navigation look like a security boundary without enforcing it
server-side is misleading.

This issue records the decision; it is not implementation work in this feature.

## Options

1. **Keep global admin.** Realm scoping stays a UX convenience. Simplest;
   matches today. Document clearly that it is not a boundary.
2. **Realm-scoped admin roles.** An operator carries roles per realm (or a realm
   allow-list) and the server rejects writes outside them. Requires changes to
   `AdminAuthMiddleware`, the operator's claims, and probably the realm list the
   operator may see. Largest change; a separate feature.

## Acceptance criteria

- The chosen option is recorded (ADR amendment or a new ADR) and, if option 2,
  broken into its own feature directory.
- If option 1, `docs/adr/0005-active-realm-context.md` keeps the explicit
  "not a security boundary" note, and the README states it.

## Out of scope

The implementation of per-realm authorization.
