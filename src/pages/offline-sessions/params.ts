import { DEFAULT_PAGE_SIZE } from "@/entities/realms";

export interface OfflineSessionsListPageParams {
  realm_id?: string;
  user_id?: string;
  client_id?: string;
  limit: number;
  offset: number;
}

const readBoundedInt = (
  value: string | null,
  fallback: number,
  min: number,
  max?: number,
) => {
  const parsed = Number(value);
  if (
    !Number.isInteger(parsed) ||
    parsed < min ||
    (max !== undefined && parsed > max)
  ) {
    return fallback;
  }
  return parsed;
};

/** Filter intent lives in the URL (ADR-0002). */
export const readOfflineSessionsListParams = (
  searchParams: URLSearchParams,
): OfflineSessionsListPageParams => {
  const realm_id = searchParams.get("realm_id") ?? undefined;
  const user_id = searchParams.get("user_id") ?? undefined;
  const client_id = searchParams.get("client_id") ?? undefined;
  return {
    ...(realm_id ? { realm_id } : {}),
    ...(user_id ? { user_id } : {}),
    ...(client_id ? { client_id } : {}),
    limit: readBoundedInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE, 1, 200),
    offset: readBoundedInt(searchParams.get("offset"), 0, 0),
  };
};
