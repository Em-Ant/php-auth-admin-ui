import { createSelector } from "@reduxjs/toolkit";
import type { LoginsState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithLogins {
  logins: LoginsState;
}

export const selectLoginsItems = (state: StateWithLogins) => state.logins.items;

const selectLoginsTotal = (state: StateWithLogins) => state.logins.total;
const selectLoginsLimit = (state: StateWithLogins) => state.logins.limit;
const selectLoginsOffset = (state: StateWithLogins) => state.logins.offset;

/** Memoized so the page object keeps a stable reference between calls. */
export const selectLoginsPage = createSelector(
  [selectLoginsTotal, selectLoginsLimit, selectLoginsOffset],
  (total, limit, offset) => ({ total, limit, offset }),
);

export const selectLoginsListStatus = (state: StateWithLogins) =>
  state.logins.listStatus;

export const selectLoginsListError = (state: StateWithLogins) =>
  state.logins.listError;
