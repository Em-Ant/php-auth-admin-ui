import type { Result } from "rexult";
import { appApiClient, type ResponseFailure } from "@/shared/api";
import {
  ADMIN_API_PREFIX,
  type ListEnvelope,
  type Session,
} from "@/shared/api/contract";
import { join } from "@/shared/lib";

export interface SessionsApiError {
  status: number | null;
  message: string;
}

const toApiError = (failure: ResponseFailure): SessionsApiError => ({
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

export interface SessionsListParams {
  realm_id?: string;
  user_id?: string;
  limit: number;
  offset: number;
}

export const listSessions = (params: SessionsListParams) => {
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
  return request<ListEnvelope<Session>>(
    appApiClient.get<ListEnvelope<Session>>(
      join([ADMIN_API_PREFIX, `/sessions?${query.toString()}`]),
    ),
  );
};

export const revokeSession = async (id: string) => {
  const result = await appApiClient.delete<unknown>(
    join([ADMIN_API_PREFIX, `/sessions/${id}`]),
  );
  result.fold(
    () => undefined,
    (failure) => {
      throw toApiError(failure);
    },
  );
};

export interface InvalidateSessionsInput {
  user_id?: string;
  client_id?: string;
}

export const invalidateSessions = (input: InvalidateSessionsInput) =>
  request<{ invalidated: number }>(
    appApiClient.post<{ invalidated: number }, InvalidateSessionsInput>(
      join([ADMIN_API_PREFIX, "/sessions/invalidate"]),
      input,
    ),
  );
