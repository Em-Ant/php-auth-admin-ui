# 07 — Per-realm authorization (decision)

- **Status:** Done
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

## Outcome

**Option 1 — keep global admin — was chosen.** The decision is recorded in
[ADR-0006](../../../docs/adr/0006-per-realm-authorization.md), which explains why
the realm-first UI is a navigation and request-scoping context rather than a
permission boundary.

- ADR-0005 keeps the explicit "not a security boundary" note and now points to
  ADR-0006 in its *Not in scope* section.
- `README.md` states the limitation in the Authorization section.
- `CONTEXT.md` already defines the Active realm the same way.
- No server, claims or middleware change is made here. Option 2 (realm-scoped
  admin roles) would be a separate feature with its own ADR.
