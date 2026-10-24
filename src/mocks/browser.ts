import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Browser worker for `start:mock`. Unhandled requests (OIDC login, discovery,
 * runtime config) fall through to the real backend, so login stays real while
 * the admin API is mocked.
 */
export const worker = setupWorker(...handlers);
