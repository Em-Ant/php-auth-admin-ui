import { forceTokenRefresh, getToken } from "../../bootstrap/auth";
import { getConfig } from "../../bootstrap/config";
import { createApiClient, rawApiClient } from "./apiClient";
import { type ResponseFailure, typedFetch } from "./typedFetch";
import { withAuth } from "./withAuth";
import { withBaseUrl } from "./withBaseUrl";

export * from "./typedFetch";

const getBaseUrl = async () => (await getConfig()).app.apiHome;

const fetchWithBase = withBaseUrl(typedFetch, getBaseUrl);
const authFetchWithBaseUrl = withAuth(
  fetchWithBase,
  getToken,
  forceTokenRefresh,
);

const appApiClient = createApiClient(authFetchWithBaseUrl);

export { appApiClient, type ResponseFailure, rawApiClient };
