import type { Result } from "rexult";
import { appApiClient, type ResponseFailure } from "@/shared/api";
import {
  ADMIN_API_PREFIX,
  type ListEnvelope,
  type Role,
} from "@/shared/api/contract";
import { join } from "@/shared/lib";

export interface RolesApiError {
  status: number | null;
  message: string;
}

const toApiError = (failure: ResponseFailure): RolesApiError => ({
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

export interface RolesListParams {
  realm_id?: string;
  client_id?: string;
  limit: number;
  offset: number;
}

export const listRoles = (params: RolesListParams) => {
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
  return request<ListEnvelope<Role>>(
    appApiClient.get<ListEnvelope<Role>>(
      join([ADMIN_API_PREFIX, `/roles?${query.toString()}`]),
    ),
  );
};

export const getRole = (id: string) =>
  request<Role>(
    appApiClient.get<Role>(join([ADMIN_API_PREFIX, `/roles/${id}`])),
  );

export interface CreateRoleInput {
  realm_id: string;
  name: string;
  client_id?: string | null;
  description?: string | null;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
}

export const createRole = (input: CreateRoleInput) =>
  request<Role>(
    appApiClient.post<Role, CreateRoleInput>(
      join([ADMIN_API_PREFIX, "/roles"]),
      input,
    ),
  );

export const updateRole = (id: string, input: UpdateRoleInput) =>
  request<Role>(
    appApiClient.put<Role, UpdateRoleInput>(
      join([ADMIN_API_PREFIX, `/roles/${id}`]),
      input,
    ),
  );

export const deleteRole = async (id: string) => {
  const result = await appApiClient.delete<unknown>(
    join([ADMIN_API_PREFIX, `/roles/${id}`]),
  );
  result.fold(
    () => undefined,
    (failure) => {
      throw toApiError(failure);
    },
  );
};
