import { createSelector } from "@reduxjs/toolkit";
import type { UsersState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithUsers {
  users: UsersState;
}

export const selectUsersItems = (state: StateWithUsers) => state.users.items;

const selectUsersTotal = (state: StateWithUsers) => state.users.total;
const selectUsersLimit = (state: StateWithUsers) => state.users.limit;
const selectUsersOffset = (state: StateWithUsers) => state.users.offset;

/** Memoized so the page object keeps a stable reference between calls. */
export const selectUsersPage = createSelector(
  [selectUsersTotal, selectUsersLimit, selectUsersOffset],
  (total, limit, offset) => ({ total, limit, offset }),
);

export const selectUsersListStatus = (state: StateWithUsers) =>
  state.users.listStatus;

export const selectUsersListError = (state: StateWithUsers) =>
  state.users.listError;

export const selectUserDetail = (state: StateWithUsers) => state.users.detail;

export const selectUserDetailStatus = (state: StateWithUsers) =>
  state.users.detailStatus;

export const selectUserDetailError = (state: StateWithUsers) =>
  state.users.detailError;

export const selectUserRoles = (state: StateWithUsers) => state.users.userRoles;

export const selectUserRolesStatus = (state: StateWithUsers) =>
  state.users.userRolesStatus;
