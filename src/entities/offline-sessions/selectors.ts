import type { OfflineSessionsState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithOfflineSessions {
  offlineSessions: OfflineSessionsState;
}

export const selectOfflineSessionsItems = (state: StateWithOfflineSessions) =>
  state.offlineSessions.items;

export const selectOfflineSessionsPage = (state: StateWithOfflineSessions) => ({
  total: state.offlineSessions.total,
  limit: state.offlineSessions.limit,
  offset: state.offlineSessions.offset,
});

export const selectOfflineSessionsListStatus = (
  state: StateWithOfflineSessions,
) => state.offlineSessions.listStatus;

export const selectOfflineSessionsListError = (
  state: StateWithOfflineSessions,
) => state.offlineSessions.listError;

export const selectOfflineSessionDetail = (state: StateWithOfflineSessions) =>
  state.offlineSessions.detail;

export const selectOfflineSessionDetailStatus = (
  state: StateWithOfflineSessions,
) => state.offlineSessions.detailStatus;

export const selectOfflineSessionDetailError = (
  state: StateWithOfflineSessions,
) => state.offlineSessions.detailError;
