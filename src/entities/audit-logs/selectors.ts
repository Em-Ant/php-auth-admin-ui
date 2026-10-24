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

export const selectAuditLogsPage = (state: StateWithAuditLogs) => ({
  total: state.auditLogs.total,
  limit: state.auditLogs.limit,
  offset: state.auditLogs.offset,
});

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
