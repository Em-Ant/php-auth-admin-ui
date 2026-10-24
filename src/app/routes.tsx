import { type LoaderFunctionArgs, Navigate, redirect } from "react-router";
import { fetchAuditLogById, fetchAuditLogs } from "@/entities/audit-logs";
import {
  fetchClientById,
  fetchClients,
  fetchScopeRoles,
} from "@/entities/clients";
import { fetchLogins } from "@/entities/logins";
import {
  fetchOfflineSessionById,
  fetchOfflineSessions,
} from "@/entities/offline-sessions";
import { fetchRealmById, fetchRealms } from "@/entities/realms";
import { fetchRoleById, fetchRoles } from "@/entities/roles";
import { fetchSessions } from "@/entities/sessions";
import { fetchUserById, fetchUserRoles, fetchUsers } from "@/entities/users";
import {
  AuditLogDetail,
  AuditLogs,
  readAuditLogsListParams,
} from "@/pages/audit-logs";
import { ClientDetail, Clients, readClientsListParams } from "@/pages/clients";
import { Forbidden } from "@/pages/forbidden";
import { Login, loginLoader } from "@/pages/login";
import { Logins, readLoginsListParams } from "@/pages/logins";
import { NotFound } from "@/pages/not-found";
import {
  OfflineSessionDetail,
  OfflineSessions,
  readOfflineSessionsListParams,
} from "@/pages/offline-sessions";
import { Overview } from "@/pages/overview";
import { RealmDetail, Realms, readRealmsListParams } from "@/pages/realms";
import { RoleDetail, Roles, readRolesListParams } from "@/pages/roles";
import { readSessionsListParams, Sessions } from "@/pages/sessions";
import { readUsersListParams, UserDetail, Users } from "@/pages/users";
import { ADMIN_ROLE, getUser, hasRole, isAuthenticated } from "@/shared/auth";
import { Loader } from "@/shared/ui/Loader";
import bootstrap from "./bootstrap";
import { ErrorPage } from "./error";
import { Layout } from "./layout";
import { requestLogin, setOperator } from "./model/operator";
import type { AppStore } from "./store/store";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const createAppLoader = (store: AppStore) => async () => {
  // Fetches config.json, then initializes keycloak once (PKCE, check-sso).
  await bootstrap();
  if (await isAuthenticated()) {
    store.dispatch(setOperator(await getUser()));
  }
  return null;
};

const requireAdmin = async () => {
  // Child loaders run in parallel with the root loader: do not assume the
  // root loader has finished initializing Keycloak yet.
  await bootstrap();
  if (!(await isAuthenticated())) {
    return redirect("/login");
  }
  if (!(await hasRole(ADMIN_ROLE))) {
    return redirect("/forbidden");
  }
  return null;
};

/**
 * Page loaders run after bootstrap. They live in their page slice and never
 * import the app layer; this wrapper is where the two are composed.
 */
const withBootstrap =
  <Args, Result>(loader: (args: Args) => Result) =>
  async (args: Args) => {
    await bootstrap();
    return loader(args);
  };

const CATALOG_LIMIT = 200;

/**
 * Page loaders live in their page slice (URL parsing); the route table
 * composes them with bootstrap and the store. List dispatches are
 * fire-and-forget so navigation is never blocked on the API (ADR-0002,
 * ADR-0003). Detail loaders await the main record so dependent dropdowns can
 * resolve from it; the slice still owns the result.
 */
const createRealmsListLoader =
  (store: AppStore) =>
  async ({ request }: LoaderFunctionArgs) => {
    await bootstrap();
    store.dispatch(
      fetchRealms(readRealmsListParams(new URL(request.url).searchParams)),
    );
    return null;
  };

const createRealmDetailLoader =
  (store: AppStore) =>
  async ({ params }: LoaderFunctionArgs) => {
    await bootstrap();
    if (params.id) {
      store.dispatch(fetchRealmById(params.id));
    }
    return null;
  };

const createClientsListLoader =
  (store: AppStore) =>
  async ({ request }: LoaderFunctionArgs) => {
    await bootstrap();
    store.dispatch(
      fetchClients(readClientsListParams(new URL(request.url).searchParams)),
    );
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    return null;
  };

const createClientDetailLoader =
  (store: AppStore) =>
  async ({ params }: LoaderFunctionArgs) => {
    await bootstrap();
    if (!params.id) {
      return null;
    }
    const client = await store
      .dispatch(fetchClientById(params.id))
      .unwrap()
      .catch(() => null);
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    if (client) {
      store.dispatch(fetchScopeRoles(client.id));
      store.dispatch(
        fetchRoles({
          realm_id: client.realm_id,
          limit: CATALOG_LIMIT,
          offset: 0,
        }),
      );
    }
    return null;
  };

const createUsersListLoader =
  (store: AppStore) =>
  async ({ request }: LoaderFunctionArgs) => {
    await bootstrap();
    store.dispatch(
      fetchUsers(readUsersListParams(new URL(request.url).searchParams)),
    );
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    return null;
  };

const createUserDetailLoader =
  (store: AppStore) =>
  async ({ params }: LoaderFunctionArgs) => {
    await bootstrap();
    if (!params.id) {
      return null;
    }
    const user = await store
      .dispatch(fetchUserById(params.id))
      .unwrap()
      .catch(() => null);
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    if (user) {
      store.dispatch(fetchUserRoles(user.id));
      store.dispatch(
        fetchRoles({
          realm_id: user.realm_id,
          limit: CATALOG_LIMIT,
          offset: 0,
        }),
      );
    }
    return null;
  };

const createRolesListLoader =
  (store: AppStore) =>
  async ({ request }: LoaderFunctionArgs) => {
    await bootstrap();
    const params = readRolesListParams(new URL(request.url).searchParams);
    store.dispatch(fetchRoles(params));
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    if (params.realm_id) {
      store.dispatch(
        fetchClients({
          realm_id: params.realm_id,
          limit: CATALOG_LIMIT,
          offset: 0,
        }),
      );
    }
    return null;
  };

const createRoleDetailLoader =
  (store: AppStore) =>
  async ({ params }: LoaderFunctionArgs) => {
    await bootstrap();
    if (!params.id) {
      return null;
    }
    const role = await store
      .dispatch(fetchRoleById(params.id))
      .unwrap()
      .catch(() => null);
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    if (role) {
      store.dispatch(
        fetchClients({
          realm_id: role.realm_id,
          limit: CATALOG_LIMIT,
          offset: 0,
        }),
      );
    }
    return null;
  };

const createSessionsListLoader =
  (store: AppStore) =>
  async ({ request }: LoaderFunctionArgs) => {
    await bootstrap();
    const params = readSessionsListParams(new URL(request.url).searchParams);
    store.dispatch(fetchSessions(params));
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    // Name resolution for the user/client columns needs the catalogs even
    // without a realm filter.
    store.dispatch(fetchUsers({ limit: CATALOG_LIMIT, offset: 0 }));
    store.dispatch(fetchClients({ limit: CATALOG_LIMIT, offset: 0 }));
    return null;
  };

const createLoginsListLoader =
  (store: AppStore) =>
  async ({ request }: LoaderFunctionArgs) => {
    await bootstrap();
    const params = readLoginsListParams(new URL(request.url).searchParams);
    store.dispatch(fetchLogins(params));
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    store.dispatch(fetchClients({ limit: CATALOG_LIMIT, offset: 0 }));
    return null;
  };

const createOfflineSessionsListLoader =
  (store: AppStore) =>
  async ({ request }: LoaderFunctionArgs) => {
    await bootstrap();
    const params = readOfflineSessionsListParams(
      new URL(request.url).searchParams,
    );
    store.dispatch(fetchOfflineSessions(params));
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    // Name resolution for the user/client columns needs the catalogs even
    // without a realm filter.
    store.dispatch(fetchUsers({ limit: CATALOG_LIMIT, offset: 0 }));
    store.dispatch(fetchClients({ limit: CATALOG_LIMIT, offset: 0 }));
    return null;
  };

const createOfflineSessionDetailLoader =
  (store: AppStore) =>
  async ({ params }: LoaderFunctionArgs) => {
    await bootstrap();
    if (!params.id) {
      return null;
    }
    const session = await store
      .dispatch(fetchOfflineSessionById(params.id))
      .unwrap()
      .catch(() => null);
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    if (session) {
      store.dispatch(
        fetchUsers({
          realm_id: session.realm_id,
          limit: CATALOG_LIMIT,
          offset: 0,
        }),
      );
      store.dispatch(
        fetchClients({
          realm_id: session.realm_id,
          limit: CATALOG_LIMIT,
          offset: 0,
        }),
      );
    }
    return null;
  };

const createAuditLogsListLoader =
  (store: AppStore) =>
  async ({ request }: LoaderFunctionArgs) => {
    await bootstrap();
    store.dispatch(
      fetchAuditLogs(
        readAuditLogsListParams(new URL(request.url).searchParams),
      ),
    );
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    return null;
  };

const createAuditLogDetailLoader =
  (store: AppStore) =>
  async ({ params }: LoaderFunctionArgs) => {
    await bootstrap();
    if (params.id) {
      store.dispatch(fetchAuditLogById(params.id));
    }
    store.dispatch(fetchRealms({ limit: CATALOG_LIMIT, offset: 0 }));
    return null;
  };

const createLoginAction = (store: AppStore) => () => {
  // The backend serves the login form; this is a full-page redirect.
  store.dispatch(requestLogin());
  return null;
};

export const createRoutes = (store: AppStore) => {
  const appLoader = createAppLoader(store);
  const loginAction = createLoginAction(store);
  const loaders = {
    realmsList: createRealmsListLoader(store),
    realmDetail: createRealmDetailLoader(store),
    clientsList: createClientsListLoader(store),
    clientDetail: createClientDetailLoader(store),
    usersList: createUsersListLoader(store),
    userDetail: createUserDetailLoader(store),
    rolesList: createRolesListLoader(store),
    roleDetail: createRoleDetailLoader(store),
    sessionsList: createSessionsListLoader(store),
    loginsList: createLoginsListLoader(store),
    offlineSessionsList: createOfflineSessionsListLoader(store),
    offlineSessionDetail: createOfflineSessionDetailLoader(store),
    auditLogsList: createAuditLogsListLoader(store),
    auditLogDetail: createAuditLogDetailLoader(store),
  };

  return [
    {
      path: "/",
      loader: appLoader,
      errorElement: <ErrorPage />,
      HydrateFallback: Loader,
      children: [
        { index: true, element: <Navigate to="/overview" replace /> },
        {
          // Authenticated shell: the sidebar with internal navigation only
          // renders after requireAdmin passes. Public screens stay outside
          // so logged-out users never see internal details.
          loader: requireAdmin,
          element: <Layout />,
          children: [
            { path: "overview", element: <Overview /> },
            { path: "realms", loader: loaders.realmsList, element: <Realms /> },
            {
              path: "realms/:id",
              loader: loaders.realmDetail,
              element: <RealmDetail />,
            },
            {
              path: "clients",
              loader: loaders.clientsList,
              element: <Clients />,
            },
            {
              path: "clients/:id",
              loader: loaders.clientDetail,
              element: <ClientDetail />,
            },
            { path: "users", loader: loaders.usersList, element: <Users /> },
            {
              path: "users/:id",
              loader: loaders.userDetail,
              element: <UserDetail />,
            },
            { path: "roles", loader: loaders.rolesList, element: <Roles /> },
            {
              path: "roles/:id",
              loader: loaders.roleDetail,
              element: <RoleDetail />,
            },
            {
              path: "sessions",
              loader: loaders.sessionsList,
              element: <Sessions />,
            },
            { path: "logins", loader: loaders.loginsList, element: <Logins /> },
            {
              path: "offline-sessions",
              loader: loaders.offlineSessionsList,
              element: <OfflineSessions />,
            },
            {
              path: "offline-sessions/:id",
              loader: loaders.offlineSessionDetail,
              element: <OfflineSessionDetail />,
            },
            {
              path: "audit-logs",
              loader: loaders.auditLogsList,
              element: <AuditLogs />,
            },
            {
              path: "audit-logs/:id",
              loader: loaders.auditLogDetail,
              element: <AuditLogDetail />,
            },
          ],
        },
        {
          path: "login",
          loader: withBootstrap(loginLoader),
          action: loginAction,
          element: <Login />,
        },
        { path: "forbidden", element: <Forbidden /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ];
};

// Vite's base is "/admin-ui/"; React Router wants a basename without the slash.
export const base = { basename: basePath === "" ? "/" : basePath };
