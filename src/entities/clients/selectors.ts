import { createSelector } from "@reduxjs/toolkit";
import type { ClientsState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithClients {
  clients: ClientsState;
}

export const selectClientsItems = (state: StateWithClients) =>
  state.clients.items;

const selectClientsTotal = (state: StateWithClients) => state.clients.total;
const selectClientsLimit = (state: StateWithClients) => state.clients.limit;
const selectClientsOffset = (state: StateWithClients) => state.clients.offset;

/** Memoized so the page object keeps a stable reference between calls. */
export const selectClientsPage = createSelector(
  [selectClientsTotal, selectClientsLimit, selectClientsOffset],
  (total, limit, offset) => ({ total, limit, offset }),
);

export const selectClientsListStatus = (state: StateWithClients) =>
  state.clients.listStatus;

export const selectClientsListError = (state: StateWithClients) =>
  state.clients.listError;

export const selectClientDetail = (state: StateWithClients) =>
  state.clients.detail;

export const selectClientDetailStatus = (state: StateWithClients) =>
  state.clients.detailStatus;

export const selectClientDetailError = (state: StateWithClients) =>
  state.clients.detailError;

export const selectClientScopeRoles = (state: StateWithClients) =>
  state.clients.scopeRoles;

export const selectClientScopeRolesStatus = (state: StateWithClients) =>
  state.clients.scopeRolesStatus;
