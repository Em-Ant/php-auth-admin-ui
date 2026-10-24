import { createSelector } from "@reduxjs/toolkit";
import type { RealmsState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithRealms {
  realms: RealmsState;
}

export const selectRealmsItems = (state: StateWithRealms) => state.realms.items;

const selectRealmsTotal = (state: StateWithRealms) => state.realms.total;
const selectRealmsLimit = (state: StateWithRealms) => state.realms.limit;
const selectRealmsOffset = (state: StateWithRealms) => state.realms.offset;

/** Memoized so the page object keeps a stable reference between calls. */
export const selectRealmsPage = createSelector(
  [selectRealmsTotal, selectRealmsLimit, selectRealmsOffset],
  (total, limit, offset) => ({ total, limit, offset }),
);

export const selectRealmsListStatus = (state: StateWithRealms) =>
  state.realms.listStatus;

export const selectRealmsListError = (state: StateWithRealms) =>
  state.realms.listError;

export const selectRealmDetail = (state: StateWithRealms) =>
  state.realms.detail;

export const selectRealmDetailStatus = (state: StateWithRealms) =>
  state.realms.detailStatus;

export const selectRealmDetailError = (state: StateWithRealms) =>
  state.realms.detailError;

const selectRealmsMutationStatus = (state: StateWithRealms) =>
  state.realms.mutationStatus;
const selectRealmsMutationError = (state: StateWithRealms) =>
  state.realms.mutationError;

/** Memoized so the mutation object keeps a stable reference between calls. */
export const selectRealmsMutation = createSelector(
  [selectRealmsMutationStatus, selectRealmsMutationError],
  (status, error) => ({ status, error }),
);
