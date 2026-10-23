import type { KeycloakConfig } from "keycloak-js";
import { rawApiClient } from "../api/utils";

export interface AppConfig {
  /** Base URL of the php-auth backend, e.g. "http://localhost:8000". */
  apiHome: string;
}

export interface Config {
  auth: KeycloakConfig;
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
