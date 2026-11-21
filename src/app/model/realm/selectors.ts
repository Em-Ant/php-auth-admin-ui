import type { RealmState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithRealm {
  realm: RealmState;
}

export const selectActiveRealmId = (state: StateWithRealm) => state.realm.id;

export const selectActiveRealmName = (state: StateWithRealm) =>
  state.realm.name;
