import type { Result } from "rexult";
import { appApiClient, type ResponseFailure } from "@/shared/api";
import {
  ADMIN_API_PREFIX,
  type ListEnvelope,
  type OfflineSession,
} from "@/shared/api/contract";
import { join } from "@/shared/lib";

export interface OfflineSessionsApiError {
  status: number | null;
  message: string;
}

const toApiError = (failure: ResponseFailure): OfflineSessionsApiError => ({
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

export interface OfflineSessionsListParams {
  realm_id?: string;
  user_id?: string;
  client_id?: string;
  limit: number;
  offset: number;
}

export const listOfflineSessions = (params: OfflineSessionsListParams) => {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.realm_id) {
    query.set("realm_id", params.realm_id);
  }
  if (params.user_id) {
    query.set("user_id", params.user_id);
  }
  if (params.client_id) {
    query.set("client_id", params.client_id);
  }
  return request<ListEnvelope<OfflineSession>>(
    appApiClient.get<ListEnvelope<OfflineSession>>(
      join([ADMIN_API_PREFIX, `/offline-sessions?${query.toString()}`]),
    ),
  );
};

export const getOfflineSession = (id: string) =>
  request<OfflineSession>(
    appApiClient.get<OfflineSession>(
      join([ADMIN_API_PREFIX, `/offline-sessions/${id}`]),
    ),
  );

export const revokeOfflineSession = async (id: string) => {
  const result = await appApiClient.delete<unknown>(
    join([ADMIN_API_PREFIX, `/offline-sessions/${id}`]),
  );
  result.fold(
    () => undefined,
    (failure) => {
      throw toApiError(failure);
    },
  );
};
