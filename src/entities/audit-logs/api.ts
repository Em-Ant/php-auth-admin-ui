import type { Result } from "rexult";
import { appApiClient, type ResponseFailure } from "@/shared/api";
import {
  ADMIN_API_PREFIX,
  type AuditLogEntry,
  type ListEnvelope,
} from "@/shared/api/contract";
import { join } from "@/shared/lib";

export interface AuditLogsApiError {
  status: number | null;
  message: string;
}

const toApiError = (failure: ResponseFailure): AuditLogsApiError => ({
  status: failure.status,
  message: failure.errors[0]?.message ?? "unknown fetching error",
});

const request = async <T>(call: Promise<Result<T, ResponseFailure>>) =>
  (await call).fold(
    (value) => value,
    (failure): T => {
      throw toApiError(failure);
    },
  );

export interface AuditLogsListParams {
  action?: string;
  actor_type?: string;
  target_type?: string;
  realm_id?: string;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
}

export const listAuditLogs = (params: AuditLogsListParams) => {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  for (const [key, value] of Object.entries(params)) {
    if (key === "limit" || key === "offset" || value === undefined) {
      continue;
    }
    query.set(key, value as string);
  }
  return request<ListEnvelope<AuditLogEntry>>(
    appApiClient.get<ListEnvelope<AuditLogEntry>>(
      join([ADMIN_API_PREFIX, `/audit-logs?${query.toString()}`]),
    ),
  );
};

export const getAuditLog = (id: string) =>
  request<AuditLogEntry>(
    appApiClient.get<AuditLogEntry>(
      join([ADMIN_API_PREFIX, `/audit-logs/${id}`]),
    ),
  );

export interface PurgeAuditLogsInput {
  realm_id?: string;
  older_than?: string;
}

export const purgeAuditLogs = (input: PurgeAuditLogsInput) => {
  // The delete client sends no body, so the guarded fields travel as query
  // params — the backend accepts either shape.
  const query = new URLSearchParams();
  if (input.realm_id) {
    query.set("realm_id", input.realm_id);
  }
  if (input.older_than) {
    query.set("older_than", input.older_than);
  }
  const suffix = query.toString();
  return request<{ deleted: number }>(
    appApiClient.delete<{ deleted: number }>(
      join([ADMIN_API_PREFIX, `/audit-logs${suffix ? `?${suffix}` : ""}`]),
    ),
  );
};
