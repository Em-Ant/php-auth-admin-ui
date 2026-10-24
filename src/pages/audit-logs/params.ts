import { DEFAULT_PAGE_SIZE } from "@/entities/realms";

export interface AuditLogsListPageParams {
  action?: string;
  actor_type?: string;
  target_type?: string;
  realm_id?: string;
  from?: string;
  to?: string;
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

const FILTER_KEYS = [
  "action",
  "actor_type",
  "target_type",
  "realm_id",
  "from",
  "to",
] as const;

/** Filter intent lives in the URL (ADR-0002). */
export const readAuditLogsListParams = (
  searchParams: URLSearchParams,
): AuditLogsListPageParams => {
  const params: AuditLogsListPageParams = {
    limit: readBoundedInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE, 1, 200),
    offset: readBoundedInt(searchParams.get("offset"), 0, 0),
  };
  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key) ?? undefined;
    if (value) {
      params[key] = value;
    }
  }
  return params;
};
