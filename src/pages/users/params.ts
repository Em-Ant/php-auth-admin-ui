import { DEFAULT_PAGE_SIZE } from "@/entities/realms";

export interface UsersListPageParams {
  realm_id?: string;
  q?: string;
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
export const readUsersListParams = (
  searchParams: URLSearchParams,
): UsersListPageParams => {
  const realm_id = searchParams.get("realm_id") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  return {
    ...(realm_id ? { realm_id } : {}),
    ...(q ? { q } : {}),
    limit: readBoundedInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE, 1, 200),
    offset: readBoundedInt(searchParams.get("offset"), 0, 0),
  };
};
