import { createSelector } from "@reduxjs/toolkit";
import type { AuditLogsState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithAuditLogs {
  auditLogs: AuditLogsState;
}

export const selectAuditLogsItems = (state: StateWithAuditLogs) =>
  state.auditLogs.items;

const selectAuditLogsTotal = (state: StateWithAuditLogs) =>
  state.auditLogs.total;
const selectAuditLogsLimit = (state: StateWithAuditLogs) =>
  state.auditLogs.limit;
const selectAuditLogsOffset = (state: StateWithAuditLogs) =>
  state.auditLogs.offset;

/** Memoized so the page object keeps a stable reference between calls. */
export const selectAuditLogsPage = createSelector(
  [selectAuditLogsTotal, selectAuditLogsLimit, selectAuditLogsOffset],
  (total, limit, offset) => ({ total, limit, offset }),
);

export const selectAuditLogsListStatus = (state: StateWithAuditLogs) =>
  state.auditLogs.listStatus;

export const selectAuditLogsListError = (state: StateWithAuditLogs) =>
  state.auditLogs.listError;

export const selectAuditLogDetail = (state: StateWithAuditLogs) =>
  state.auditLogs.detail;

export const selectAuditLogDetailStatus = (state: StateWithAuditLogs) =>
  state.auditLogs.detailStatus;

export const selectAuditLogDetailError = (state: StateWithAuditLogs) =>
  state.auditLogs.detailError;
