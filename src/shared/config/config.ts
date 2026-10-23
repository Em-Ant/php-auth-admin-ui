import type { KeycloakServerConfig } from "keycloak-js";
// Import the client module, not the composed `@/shared/api` entry: that entry
// depends on this module for the base URL, which would close a cycle.
import { rawApiClient } from "@/shared/api/apiClient";

export interface AppConfig {
  /** Base URL of the php-auth backend, e.g. "http://localhost:8000". */
  apiHome: string;
}

export interface Config {
  auth: KeycloakServerConfig;
  app: AppConfig;
}

let config: Config | null = null;

// Resolve against the Vite base so deep links (e.g. /admin-ui/realms) still
// find the runtime config. A relative "./config.json" would resolve against
// the current route instead of the app root.
export const getConfig = async (
  path = `${import.meta.env.BASE_URL}config.json`,
) => {
  if (config === null) {
    config = (await rawApiClient.get<Config>(path)).getOrThrow();
  }
  return config;
};
