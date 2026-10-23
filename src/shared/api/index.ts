import { forceTokenRefresh, getToken } from "@/shared/auth";
import { getConfig } from "@/shared/config";
import { createApiClient, rawApiClient } from "./apiClient";
import { type ResponseFailure, typedFetch } from "./typedFetch";
import { withAuth } from "./withAuth";
import { withBaseUrl } from "./withBaseUrl";

export * from "./contract";
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
