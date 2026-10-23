# 0002 — React Router data mode

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The app is an auth-gated admin SPA with a fixed set of screens. Every screen
sits behind a Keycloak session that must be checked before protected UI
renders, list screens are driven by URL pagination and filters, and Redux owns
all server state (ADR-0003). React Router 7 supports declarative routing
(`BrowserRouter` + `Routes`), data mode (`createBrowserRouter` + route
`loader`/`action`), and framework mode (SSR/build integration).

## Decision

Use React Router in **data mode**: `createBrowserRouter` plus `RouterProvider`,
configured from route objects in `src/routes.tsx`.

- **Basename** comes from `import.meta.env.BASE_URL`, because the app is served
  under `/admin-ui/`.
- **Bootstrapping** happens in the root route loader: runtime config is
  fetched and Keycloak initialized exactly once through the memoized promise
  in `src/bootstrap/index.ts`; the signed-in user is then hydrated into the
  `user` slice.
- **Guards** are loaders, not effects. A pathless layout route runs
  `requireAdmin`, which returns a `redirect()` to `/login?from=…` or
  `/forbidden` before the protected route renders.
- **Data loaders dispatch, they do not return data.** A protected screen's
  loader awaits bootstrap, calls the same guard, reads pagination/filters from
  `request.url`, then dispatches its fetch thunk and returns `null`. The slice
  owns loading, error and pagination state, and the page renders its skeleton.
  See ADR-0003.
- **A loader does not read other slices.** If the request depends on state
  owned by another slice, the loader dispatches a thunk that resolves the value
  through that slice's selector. It never calls `store.getState()` at the
  dispatch site (ADR-0003).
- **The login action** dispatches `requestLogin`, which redirects the browser
  to the backend-served login page. The login loader sends an already
  authenticated operator back into the app.
- **URL search params are the request; the slice holds the applied result.**
  `limit`/`offset` and filters live in the URL. Loaders read them and dispatch
  the fetch; the slice stores the `limit`/`offset` the API echoed back, and the
  UI builds its next links from those applied values. The URL is never mirrored
  as a second copy of the data.
- **Initial load** renders the shared `Loader` via `HydrateFallback`.
- **Code splitting** uses route `lazy` when screens are added, so each screen
  loads with its own chunk.
- **Loader/action failures** belong in route-level `errorElement`s rather than
  the default development error screen. (Not yet added; the current 404 and
  placeholder screens do not throw.)

Declarative mode and framework/SSR mode are both rejected for now.

## Consequences

- There is no flash of protected UI and no `useEffect`-based auth check; a
  guard resolves before the route renders.
- Matched loaders run in parallel. Nothing may assume the root loader has
  finished, so the bootstrap promise is shared and every auth-touching loader
  awaits it. A parent guard redirecting does not prevent a sibling data loader
  from running, so data loaders run the guard themselves before dispatching.
- Because data loaders dispatch fire-and-forget thunks, navigation is not
  blocked on the API; the destination renders immediately with its slice's
  loading state.
- The production host must rewrite `/admin-ui/*` to `index.html`. `vite
  preview` supplies that fallback; a plain static folder does not, so a refresh
  on a deep link would otherwise be a 404.
- Loader return values are not used for data, so there is no second cache and
  no revalidation semantics to reconcile with Redux. Revisiting a screen
  re-dispatches its fetch.
- Data errors are rendered from slices, not error boundaries. A `409` with an
  actionable `error_description` can be shown inline and the operator can retry
  without leaving the screen.

## Revisit when

The app moves to React Router framework mode (SSR or full-stack), or ADR-0003
is replaced and the router is asked to own server data. Either would change
what loaders are for.
