/**
 * Realm scope for a scoped list request. The realm travels as a path segment,
 * not as a filter field, so callers merge it into their fetch params from the
 * route/outlet context. Empty when no realm is active, so a request is never
 * accidentally cross-realm.
 */
export const realmScope = (realmId: string | null | undefined) =>
  realmId ? { realm_id: realmId } : {};
