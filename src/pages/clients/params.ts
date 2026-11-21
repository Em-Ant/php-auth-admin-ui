import { DEFAULT_PAGE_SIZE } from "@/entities/realms";

export interface ClientsListPageParams {
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

/** Filter intent lives in the URL (ADR-0002); the realm comes from the path. */
export const readClientsListParams = (
  searchParams: URLSearchParams,
): ClientsListPageParams => {
  const q = searchParams.get("q") ?? undefined;
  return {
    ...(q ? { q } : {}),
    limit: readBoundedInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE, 1, 200),
    offset: readBoundedInt(searchParams.get("offset"), 0, 0),
  };
};
