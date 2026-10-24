import type { Result } from "rexult";
import { appApiClient, type ResponseFailure } from "@/shared/api";
import {
  ADMIN_API_PREFIX,
  type ListEnvelope,
  type Login,
} from "@/shared/api/contract";
import { join } from "@/shared/lib";

export interface LoginsApiError {
  status: number | null;
  message: string;
}

const toApiError = (failure: ResponseFailure): LoginsApiError => ({
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

export interface LoginsListParams {
  realm_id?: string;
  client_id?: string;
  limit: number;
  offset: number;
}

export const listLogins = (params: LoginsListParams) => {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.realm_id) {
    query.set("realm_id", params.realm_id);
  }
  if (params.client_id) {
    query.set("client_id", params.client_id);
  }
  return request<ListEnvelope<Login>>(
    appApiClient.get<ListEnvelope<Login>>(
      join([ADMIN_API_PREFIX, `/logins?${query.toString()}`]),
    ),
  );
};

export const deleteLogin = async (id: string) => {
  const result = await appApiClient.delete<unknown>(
    join([ADMIN_API_PREFIX, `/logins/${id}`]),
  );
  result.fold(
    () => undefined,
    (failure) => {
      throw toApiError(failure);
    },
  );
};
