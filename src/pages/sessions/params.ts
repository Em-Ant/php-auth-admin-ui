import { DEFAULT_PAGE_SIZE } from "@/entities/realms";

export interface SessionsListPageParams {
  realm_id?: string;
  user_id?: string;
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
export const readSessionsListParams = (
  searchParams: URLSearchParams,
): SessionsListPageParams => {
  const realm_id = searchParams.get("realm_id") ?? undefined;
  const user_id = searchParams.get("user_id") ?? undefined;
  return {
    ...(realm_id ? { realm_id } : {}),
    ...(user_id ? { user_id } : {}),
    limit: readBoundedInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE, 1, 200),
    offset: readBoundedInt(searchParams.get("offset"), 0, 0),
  };
};
