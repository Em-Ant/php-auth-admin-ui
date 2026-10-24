import { Navigate, redirect } from "react-router";
import { Forbidden } from "@/pages/forbidden";
import { Login, loginLoader } from "@/pages/login";
import { NotFound } from "@/pages/not-found";
import { Overview } from "@/pages/overview";
import { ADMIN_ROLE, getUser, hasRole, isAuthenticated } from "@/shared/auth";
import { Loader } from "@/shared/ui/Loader";
import { Placeholder } from "@/shared/ui/Placeholder";
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

const createLoginAction = (store: AppStore) => () => {
  // The backend serves the login form; this is a full-page redirect.
  store.dispatch(requestLogin());
  return null;
};

export const createRoutes = (store: AppStore) => {
  const appLoader = createAppLoader(store);
  const loginAction = createLoginAction(store);

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
            {
              path: "realms",
              element: (
                <Placeholder
                  title="Realms"
                  description="Tenants own the key set, token lifetimes, scope catalog and password policy."
                />
              ),
            },
            {
              path: "clients",
              element: (
                <Placeholder
                  title="Clients"
                  description="Public and confidential applications, their redirect URI patterns, secrets and scope-to-role mappings."
                />
              ),
            },
            {
              path: "users",
              element: (
                <Placeholder
                  title="Users"
                  description="People in a realm: profile, active switch, roles and the sessions they hold."
                />
              ),
            },
            {
              path: "roles",
              element: (
                <Placeholder
                  title="Roles"
                  description="Realm roles and client roles, the grants that scope-to-role mappings hand out."
                />
              ),
            },
            {
              path: "sessions",
              element: (
                <Placeholder
                  title="Sessions"
                  description="Who is currently signed in: one SSO session per browser."
                />
              ),
            },
            {
              path: "logins",
              element: (
                <Placeholder
                  title="Logins"
                  description="Sign-in activity: one authentication attempt per client, not a session."
                />
              ),
            },
            {
              path: "offline-sessions",
              element: (
                <Placeholder
                  title="Offline sessions"
                  description="Standing access: long-lived refresh grants that survive SSO logout. Deleting one revokes it."
                />
              ),
            },
            {
              path: "audit-logs",
              element: (
                <Placeholder
                  title="Audit log"
                  description="Every admin write on realms, clients, users, roles and scope-role mappings."
                />
              ),
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
