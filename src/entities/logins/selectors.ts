import type { LoginsState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithLogins {
  logins: LoginsState;
}

export const selectLoginsItems = (state: StateWithLogins) => state.logins.items;

export const selectLoginsPage = (state: StateWithLogins) => ({
  total: state.logins.total,
  limit: state.logins.limit,
  offset: state.logins.offset,
});

export const selectLoginsListStatus = (state: StateWithLogins) =>
  state.logins.listStatus;

export const selectLoginsListError = (state: StateWithLogins) =>
  state.logins.listError;
