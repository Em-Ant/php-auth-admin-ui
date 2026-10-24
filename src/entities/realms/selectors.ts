import type { RealmsState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithRealms {
  realms: RealmsState;
}

export const selectRealmsItems = (state: StateWithRealms) => state.realms.items;

export const selectRealmsPage = (state: StateWithRealms) => ({
  total: state.realms.total,
  limit: state.realms.limit,
  offset: state.realms.offset,
});

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

export const selectRealmsMutation = (state: StateWithRealms) => ({
  status: state.realms.mutationStatus,
  error: state.realms.mutationError,
});
