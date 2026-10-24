import { createSelector } from "@reduxjs/toolkit";
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

const selectOfflineSessionsTotal = (state: StateWithOfflineSessions) =>
  state.offlineSessions.total;
const selectOfflineSessionsLimit = (state: StateWithOfflineSessions) =>
  state.offlineSessions.limit;
const selectOfflineSessionsOffset = (state: StateWithOfflineSessions) =>
  state.offlineSessions.offset;

/** Memoized so the page object keeps a stable reference between calls. */
export const selectOfflineSessionsPage = createSelector(
  [
    selectOfflineSessionsTotal,
    selectOfflineSessionsLimit,
    selectOfflineSessionsOffset,
  ],
  (total, limit, offset) => ({ total, limit, offset }),
);

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
