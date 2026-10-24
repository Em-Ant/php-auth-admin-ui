import { HttpResponse } from "msw";
import type { ListEnvelope } from "@/shared/api/contract";

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

/**
 * Pagination follows API-CONTRACT.md §3: `limit` defaults to 50 and any
 * out-of-range or unparseable value silently becomes the default instead of
 * an error. `offset` defaults to 0. Callers must read `limit` back from the
 * response rather than trusting what they sent.
 */
export const readPagination = (url: URL) => {
  const rawLimit = Number(url.searchParams.get("limit"));
  const rawOffset = Number(url.searchParams.get("offset"));
  const limit =
    Number.isInteger(rawLimit) && rawLimit >= 1 && rawLimit <= MAX_LIMIT
      ? rawLimit
      : DEFAULT_LIMIT;
  const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
  return { limit, offset };
};

export const paginate = <T>(items: T[], url: URL): ListEnvelope<T> => {
  const { limit, offset } = readPagination(url);
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    limit,
    offset,
  };
};

/** OAuth2-shaped failure body from API-CONTRACT.md §3. */
export const errorResponse = (
  status: number,
  error: string,
  error_description?: string,
) =>
  HttpResponse.json(
    error_description === undefined ? { error } : { error, error_description },
    { status },
  );

/**
 * Prefix type-ahead from API-CONTRACT.md §3: matches the start of any
 * candidate, ASCII case-insensitive. Terms over 128 chars are truncated.
 */
export const matchesPrefixQuery = (
  q: string,
  candidates: (string | null)[],
) => {
  const term = q.slice(0, 128).toLowerCase();
  return candidates.some(
    (candidate) => candidate?.toLowerCase().startsWith(term) ?? false,
  );
};

/** Bare `YYYY-MM-DD` guard for the audit-log `from`/`to` filters. */
export const isValidAuditDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};
