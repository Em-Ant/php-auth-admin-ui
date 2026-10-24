import type { UsersState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithUsers {
  users: UsersState;
}

export const selectUsersItems = (state: StateWithUsers) => state.users.items;

export const selectUsersPage = (state: StateWithUsers) => ({
  total: state.users.total,
  limit: state.users.limit,
  offset: state.users.offset,
});

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
