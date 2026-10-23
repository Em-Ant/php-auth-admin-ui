import Keycloak, {
  type KeycloakConfig,
  type KeycloakLoginOptions,
  type KeycloakLogoutOptions,
  type KeycloakTokenParsed,
} from "keycloak-js";

let keycloakInstance: Promise<Keycloak> | null = null;

const getKcInstance = async () => {
  if (keycloakInstance === null) {
    throw new Error("auth: kc instance not initialized");
  }
  return await keycloakInstance;
};

export const initKeycloak = (config: KeycloakConfig) => {
  if (!keycloakInstance) {
    keycloakInstance = new Promise<Keycloak>((resolve, reject) => {
      const instance = new Keycloak(config);
      instance
        .init({
          // checkLoginIframe relies on the backend serving
          // login-status-iframe.html; disable if the clone does not.
          checkLoginIframe: false,
          // Silent re-auth on boot: the SSO session cookie satisfies it
          // without a password prompt, tokens never touch localStorage.
          onLoad: "check-sso",
          pkceMethod: "S256",
        })
        .then(() => resolve(instance))
        .catch(reject);
    });
  }
  return keycloakInstance;
};

export const isAuthenticated = async () => {
  return !!(await getKcInstance()).authenticated;
};

export const getToken = async () => {
  const instance = await getKcInstance();
  await instance.updateToken();
  return instance.token ?? "";
};

export const forceTokenRefresh = async () => {
  const instance = await getKcInstance();
  await instance.updateToken(-1);
};

export const login = async (options?: KeycloakLoginOptions) => {
  const instance = await getKcInstance();
  if (!instance.authenticated) {
    await instance.login(options);
  }
};

export const logout = async (options?: KeycloakLogoutOptions) => {
  const instance = await getKcInstance();
  if (instance.authenticated) {
    await instance.logout(options);
  }
};

type TokenParsed = KeycloakTokenParsed & {
  preferred_username: string;
};

export const getTokenParsed = async (): Promise<TokenParsed> => {
  return (await getKcInstance()).tokenParsed as TokenParsed;
};

export const getUser = async () => {
  const { preferred_username, realm_access } = await getTokenParsed();
  return {
    name: preferred_username,
    roles: realm_access?.roles ?? [],
  };
};

export const hasRole = async (role: string) => {
  return (await getKcInstance()).hasRealmRole(role);
};
