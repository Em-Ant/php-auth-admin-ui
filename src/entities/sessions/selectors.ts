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

export const selectSessionsPage = (state: StateWithSessions) => ({
  total: state.sessions.total,
  limit: state.sessions.limit,
  offset: state.sessions.offset,
});

export const selectSessionsListStatus = (state: StateWithSessions) =>
  state.sessions.listStatus;

export const selectSessionsListError = (state: StateWithSessions) =>
  state.sessions.listError;
