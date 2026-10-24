import { DEFAULT_PAGE_SIZE } from "@/entities/realms";

export interface RealmsListPageParams {
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

/**
 * Pagination intent lives in the URL (ADR-0002). Mirrors the backend rules:
 * `limit` defaults when out of range, `offset` floors at zero.
 */
export const readRealmsListParams = (
  searchParams: URLSearchParams,
): RealmsListPageParams => ({
  limit: readBoundedInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE, 1, 200),
  offset: readBoundedInt(searchParams.get("offset"), 0, 0),
});
