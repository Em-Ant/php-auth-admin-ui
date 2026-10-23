import { KeyRound, ShieldAlert } from "lucide-react";
import {
  Form,
  type LoaderFunctionArgs,
  Navigate,
  redirect,
} from "react-router";
import bootstrap from "./bootstrap";
import { getUser, hasRole, isAuthenticated } from "./bootstrap/auth";
import { Loader } from "./components/Loader";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { requestLogin, setLoggedInUser } from "./features/user/slice";
import { ErrorPage } from "./pages/ErrorPage";
import { Layout } from "./pages/Layout";
import { NotFound } from "./pages/NotFound";
import { Overview } from "./pages/Overview";
import { Placeholder } from "./pages/Placeholder";
import type { AppStore } from "./store/store";

/** The admin JWT must carry this role on every /admin/* call. */
const ADMIN_ROLE = "admin";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/** The router strips the basename; loader request URLs do not. */
const stripBasePath = (pathname: string) =>
  basePath && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || "/"
    : pathname;

const createAppLoader = (store: AppStore) => async () => {
  // Fetches config.json, then initializes keycloak once (PKCE, check-sso).
  await bootstrap();
  if (await isAuthenticated()) {
    store.dispatch(setLoggedInUser(await getUser()));
  }
  return null;
};

const requireAdmin = async ({ request }: LoaderFunctionArgs) => {
  // Child loaders run in parallel with the root loader: do not assume the
  // root loader has finished initializing Keycloak yet.
  await bootstrap();
  if (!(await isAuthenticated())) {
    const params = new URLSearchParams({
      from: stripBasePath(new URL(request.url).pathname),
    });
    return redirect(`/login?${params.toString()}`);
  }
  if (!(await hasRole(ADMIN_ROLE))) {
    return redirect("/forbidden");
  }
  return null;
};

const loginLoader = async ({ request }: LoaderFunctionArgs) => {
  await bootstrap();
  if (await isAuthenticated()) {
    const from = new URL(request.url).searchParams.get("from");
    // Only ever redirect inside the app, never to "//evil.example".
    return redirect(
      from?.startsWith("/") && !from.startsWith("//") ? from : "/",
    );
  }
  return null;
};

const createLoginAction = (store: AppStore) => () => {
  // The backend serves the login form; this is a full-page redirect.
  store.dispatch(requestLogin());
  return null;
};

const Login = () => (
  <div className="flex min-h-[70vh] items-center justify-center">
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
          <KeyRound className="size-5" />
        </div>
        <CardTitle>Sign in to Admin UI</CardTitle>
        <CardDescription>
          The admin realm serves the login form. You will be redirected to the
          backend, then brought back here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form method="POST">
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </Form>
      </CardContent>
    </Card>
  </div>
);

const Forbidden = () => (
  <div className="flex min-h-[70vh] items-center justify-center">
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="size-5" />
        </div>
        <CardTitle>Forbidden</CardTitle>
        <CardDescription>
          Your access token does not carry the &quot;{ADMIN_ROLE}&quot; role.
          Ask an administrator for it and sign in again.
        </CardDescription>
      </CardHeader>
    </Card>
  </div>
);

export const createRoutes = (store: AppStore) => {
  const appLoader = createAppLoader(store);
  const loginAction = createLoginAction(store);

  return [
    {
      path: "/",
      loader: appLoader,
      element: <Layout />,
      errorElement: <ErrorPage />,
      HydrateFallback: Loader,
      children: [
        { index: true, element: <Navigate to="/overview" replace /> },
        {
          loader: requireAdmin,
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
          loader: loginLoader,
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
