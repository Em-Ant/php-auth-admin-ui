import { setupServer } from "msw/node";
import { resetMockDb } from "./db";
import { handlers } from "./handlers";

/**
 * Node-side mock for future integration tests (ADR-0004): the test starts
 * from its route with a real store and router, and the API boundary is this
 * server instead of `appApiClient` spies. Unhandled requests fail loudly so
 * contract drift surfaces in the suite rather than slipping through.
 *
 * Usage in a test file:
 *
 * ```ts
 * import { mockServer } from "@/mocks/server";
 *
 * beforeAll(() => mockServer.listen({ onUnhandledFrame: "error" }));
 * beforeEach(() => resetMockDb());
 * afterAll(() => mockServer.close());
 * ```
 */
export const mockServer = setupServer(...handlers);

export { resetMockDb };
