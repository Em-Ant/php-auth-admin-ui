import type { Result } from "rexult";
import { appApiClient, type ResponseFailure } from "@/shared/api";
import {
  ADMIN_API_PREFIX,
  type ListEnvelope,
  type Role,
  type User,
} from "@/shared/api/contract";
import { join } from "@/shared/lib";

export interface UsersApiError {
  status: number | null;
  message: string;
}

const toApiError = (failure: ResponseFailure): UsersApiError => ({
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

export interface UsersListParams {
  realm_id?: string;
  q?: string;
  limit: number;
  offset: number;
}

export const listUsers = (params: UsersListParams) => {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.realm_id) {
    query.set("realm_id", params.realm_id);
  }
  if (params.q) {
    query.set("q", params.q);
  }
  return request<ListEnvelope<User>>(
    appApiClient.get<ListEnvelope<User>>(
      join([ADMIN_API_PREFIX, `/users?${query.toString()}`]),
    ),
  );
};

export const getUserById = (id: string) =>
  request<User>(
    appApiClient.get<User>(join([ADMIN_API_PREFIX, `/users/${id}`])),
  );

export interface CreateUserInput {
  realm_id: string;
  email: string;
  password: string;
  name?: string | null;
  valid?: boolean;
  email_verified?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  name?: string | null;
  valid?: boolean;
  email_verified?: boolean;
  password?: string;
}

export const createUser = (input: CreateUserInput) =>
  request<User>(
    appApiClient.post<User, CreateUserInput>(
      join([ADMIN_API_PREFIX, "/users"]),
      input,
    ),
  );

export const updateUser = (id: string, input: UpdateUserInput) =>
  request<User>(
    appApiClient.put<User, UpdateUserInput>(
      join([ADMIN_API_PREFIX, `/users/${id}`]),
      input,
    ),
  );

export const deleteUser = async (id: string) => {
  const result = await appApiClient.delete<unknown>(
    join([ADMIN_API_PREFIX, `/users/${id}`]),
  );
  result.fold(
    () => undefined,
    (failure) => {
      throw toApiError(failure);
    },
  );
};

export const listUserRoles = (userId: string) =>
  request<ListEnvelope<Role>>(
    appApiClient.get<ListEnvelope<Role>>(
      join([ADMIN_API_PREFIX, `/users/${userId}/roles?limit=200`]),
    ),
  );

export const assignUserRole = (userId: string, roleId: string) =>
  request<Role>(
    appApiClient.post<Role, { role_id: string }>(
      join([ADMIN_API_PREFIX, `/users/${userId}/roles`]),
      { role_id: roleId },
    ),
  );

export const removeUserRole = async (userId: string, roleId: string) => {
  const result = await appApiClient.delete<unknown>(
    join([ADMIN_API_PREFIX, `/users/${userId}/roles/${roleId}`]),
  );
  result.fold(
    () => undefined,
    (failure) => {
      throw toApiError(failure);
    },
  );
};
