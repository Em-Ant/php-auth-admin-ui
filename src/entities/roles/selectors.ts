import { createSelector } from "@reduxjs/toolkit";
import type { RolesState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithRoles {
  roles: RolesState;
}

export const selectRolesItems = (state: StateWithRoles) => state.roles.items;

const selectRolesTotal = (state: StateWithRoles) => state.roles.total;
const selectRolesLimit = (state: StateWithRoles) => state.roles.limit;
const selectRolesOffset = (state: StateWithRoles) => state.roles.offset;

/** Memoized so the page object keeps a stable reference between calls. */
export const selectRolesPage = createSelector(
  [selectRolesTotal, selectRolesLimit, selectRolesOffset],
  (total, limit, offset) => ({ total, limit, offset }),
);

export const selectRolesListStatus = (state: StateWithRoles) =>
  state.roles.listStatus;

export const selectRolesListError = (state: StateWithRoles) =>
  state.roles.listError;

export const selectRoleDetail = (state: StateWithRoles) => state.roles.detail;

export const selectRoleDetailStatus = (state: StateWithRoles) =>
  state.roles.detailStatus;

export const selectRoleDetailError = (state: StateWithRoles) =>
  state.roles.detailError;
