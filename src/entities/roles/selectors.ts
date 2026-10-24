import type { RolesState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithRoles {
  roles: RolesState;
}

export const selectRolesItems = (state: StateWithRoles) => state.roles.items;

export const selectRolesPage = (state: StateWithRoles) => ({
  total: state.roles.total,
  limit: state.roles.limit,
  offset: state.roles.offset,
});

export const selectRolesListStatus = (state: StateWithRoles) =>
  state.roles.listStatus;

export const selectRolesListError = (state: StateWithRoles) =>
  state.roles.listError;

export const selectRoleDetail = (state: StateWithRoles) => state.roles.detail;

export const selectRoleDetailStatus = (state: StateWithRoles) =>
  state.roles.detailStatus;

export const selectRoleDetailError = (state: StateWithRoles) =>
  state.roles.detailError;
