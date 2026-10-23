import { vi } from "vitest";
import { appApiClient, rawApiClient } from "@/shared/api";

/**
 * Spies on the authenticated clients. A test mocks at this boundary so the
 * real thunks, slices and selectors still run (ADR-0004).
 *
 * `setupTests.ts` restores the spies after every test.
 */
export const mockAppApi = () => ({
  get: vi.spyOn(appApiClient, "get"),
  post: vi.spyOn(appApiClient, "post"),
  put: vi.spyOn(appApiClient, "put"),
  patch: vi.spyOn(appApiClient, "patch"),
  delete: vi.spyOn(appApiClient, "delete"),
});

/** Public endpoints (`/health`, `/ready`, runtime config). */
export const mockRawApi = () => ({
  get: vi.spyOn(rawApiClient, "get"),
});
