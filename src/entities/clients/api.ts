import type { Result } from "rexult";
import { appApiClient, type ResponseFailure } from "@/shared/api";
import {
  ADMIN_API_PREFIX,
  type Client,
  type ListEnvelope,
  type ScopeRoleMapping,
} from "@/shared/api/contract";
import { join } from "@/shared/lib";

export interface ClientsApiError {
  status: number | null;
  message: string;
}

const toApiError = (failure: ResponseFailure): ClientsApiError => ({
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

export interface ClientsListParams {
  realm_id?: string;
  q?: string;
  limit: number;
  offset: number;
}

const listQuery = (params: ClientsListParams) => {
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
  return join([ADMIN_API_PREFIX, `/clients?${query.toString()}`]);
};

export const listClients = (params: ClientsListParams) =>
  request<ListEnvelope<Client>>(
    appApiClient.get<ListEnvelope<Client>>(listQuery(params)),
  );

export const getClient = (id: string) =>
  request<Client>(
    appApiClient.get<Client>(join([ADMIN_API_PREFIX, `/clients/${id}`])),
  );

export interface CreateClientInput {
  name: string;
  uri: string;
  realm_id: string;
  require_auth: boolean;
  client_secret?: string;
  scope?: string | null;
}

export interface UpdateClientInput {
  name?: string;
  uri?: string;
  require_auth?: boolean;
  client_secret?: string;
  scope?: string | null;
}

export const createClient = (input: CreateClientInput) =>
  request<Client>(
    appApiClient.post<Client, CreateClientInput>(
      join([ADMIN_API_PREFIX, "/clients"]),
      input,
    ),
  );

export const updateClient = (id: string, input: UpdateClientInput) =>
  request<Client>(
    appApiClient.put<Client, UpdateClientInput>(
      join([ADMIN_API_PREFIX, `/clients/${id}`]),
      input,
    ),
  );

export const deleteClient = async (id: string) => {
  const result = await appApiClient.delete<unknown>(
    join([ADMIN_API_PREFIX, `/clients/${id}`]),
  );
  result.fold(
    () => undefined,
    (failure) => {
      throw toApiError(failure);
    },
  );
};

export const listScopeRoles = (clientId: string) =>
  request<ListEnvelope<ScopeRoleMapping>>(
    appApiClient.get<ListEnvelope<ScopeRoleMapping>>(
      join([ADMIN_API_PREFIX, `/clients/${clientId}/scope-roles?limit=200`]),
    ),
  );

export interface AddScopeRoleInput {
  scope: string;
  role_id: string;
  required: boolean;
}

export const addScopeRole = (clientId: string, input: AddScopeRoleInput) =>
  request<ScopeRoleMapping>(
    appApiClient.post<ScopeRoleMapping, AddScopeRoleInput>(
      join([ADMIN_API_PREFIX, `/clients/${clientId}/scope-roles`]),
      input,
    ),
  );

export const updateScopeRole = (
  clientId: string,
  scope: string,
  roleId: string,
  required: boolean,
) =>
  request<{ scope: string; role_id: string; required: boolean }>(
    appApiClient.put<
      { scope: string; role_id: string; required: boolean },
      { required: boolean }
    >(
      join([
        ADMIN_API_PREFIX,
        `/clients/${clientId}/scope-roles/${encodeURIComponent(scope)}/${roleId}`,
      ]),
      { required },
    ),
  );

export const deleteScopeRole = (
  clientId: string,
  scope: string,
  roleId: string,
) => {
  const resultPromise = appApiClient.delete<unknown>(
    join([
      ADMIN_API_PREFIX,
      `/clients/${clientId}/scope-roles/${encodeURIComponent(scope)}/${roleId}`,
    ]),
  );
  return resultPromise.then((result) =>
    result.fold(
      () => undefined,
      (failure) => {
        throw toApiError(failure);
      },
    ),
  );
};
