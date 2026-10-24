import { createSelector } from "@reduxjs/toolkit";
import type { SessionsState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithSessions {
  sessions: SessionsState;
}

export const selectSessionsItems = (state: StateWithSessions) =>
  state.sessions.items;

const selectSessionsTotal = (state: StateWithSessions) => state.sessions.total;
const selectSessionsLimit = (state: StateWithSessions) => state.sessions.limit;
const selectSessionsOffset = (state: StateWithSessions) =>
  state.sessions.offset;

/** Memoized so the page object keeps a stable reference between calls. */
export const selectSessionsPage = createSelector(
  [selectSessionsTotal, selectSessionsLimit, selectSessionsOffset],
  (total, limit, offset) => ({ total, limit, offset }),
);

export const selectSessionsListStatus = (state: StateWithSessions) =>
  state.sessions.listStatus;

export const selectSessionsListError = (state: StateWithSessions) =>
  state.sessions.listError;
