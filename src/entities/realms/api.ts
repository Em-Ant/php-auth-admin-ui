import type { Result } from "rexult";
import { appApiClient, type ResponseFailure } from "@/shared/api";
import {
  ADMIN_API_PREFIX,
  type ListEnvelope,
  type Realm,
} from "@/shared/api/contract";
import { join } from "@/shared/lib";

/** Structured API failure a thunk forwards to the slice via rejectWithValue. */
export interface RealmsApiError {
  status: number | null;
  message: string;
}

const toApiError = (failure: ResponseFailure): RealmsApiError => ({
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

export interface RealmsListParams {
  limit: number;
  offset: number;
}

export const listRealms = (params: RealmsListParams) =>
  request<ListEnvelope<Realm>>(
    appApiClient.get<ListEnvelope<Realm>>(
      join([
        ADMIN_API_PREFIX,
        `/realms?limit=${params.limit}&offset=${params.offset}`,
      ]),
    ),
  );

export const getRealm = (id: string) =>
  request<Realm>(
    appApiClient.get<Realm>(join([ADMIN_API_PREFIX, `/realms/${id}`])),
  );

export interface RealmTtls {
  refresh_token_expires_in: number;
  access_token_expires_in: number;
  pending_login_expires_in: number;
  authenticated_login_expires_in: number;
  session_expires_in: number;
  idle_session_expires_in: number;
  offline_refresh_token_expires_in: number;
}

export interface RealmPasswordPolicy {
  password_min_length: number | null;
  password_min_lower: number | null;
  password_min_upper: number | null;
  password_min_digits: number | null;
  password_min_special: number | null;
}

export interface CreateRealmInput
  extends Partial<RealmTtls>,
    Partial<RealmPasswordPolicy> {
  name: string;
  keys_id: string;
  scope?: string;
}

export interface UpdateRealmInput extends Partial<RealmTtls> {
  name?: string;
  keys_id?: string;
  scope?: string | null;
  password_min_length?: number | null;
  password_min_lower?: number | null;
  password_min_upper?: number | null;
  password_min_digits?: number | null;
  password_min_special?: number | null;
}

export const createRealm = (input: CreateRealmInput) =>
  request<Realm>(
    appApiClient.post<Realm, CreateRealmInput>(
      join([ADMIN_API_PREFIX, "/realms"]),
      input,
    ),
  );

export const updateRealm = (id: string, input: UpdateRealmInput) =>
  request<Realm>(
    appApiClient.put<Realm, UpdateRealmInput>(
      join([ADMIN_API_PREFIX, `/realms/${id}`]),
      input,
    ),
  );

export const deleteRealm = async (id: string) => {
  const result = await appApiClient.delete<unknown>(
    join([ADMIN_API_PREFIX, `/realms/${id}`]),
  );
  result.fold(
    () => undefined,
    (failure) => {
      throw toApiError(failure);
    },
  );
};

export const createKeys = () =>
  request<{ kid: string }>(
    appApiClient.post<{ kid: string }, Record<string, never>>(
      join([ADMIN_API_PREFIX, "/keys"]),
      {},
    ),
  );
