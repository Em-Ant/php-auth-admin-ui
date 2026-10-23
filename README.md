# Admin UI

A single-page admin dashboard for the **php-auth** OIDC server. It manages
realms, clients, users, roles, sessions, logins, offline sessions and the audit
log through the `/admin/*` API.

**Status:** the application shell is initialised — runtime config, Keycloak
login, admin-guarded routes, sidebar layout and the documented screen routes.
The domain screens are placeholders and are built next. The backend and wire
format are described in the handoff doc
[`API-CONTRACT`](.scratch/admin-ui/API-CONTRACT.md).

## Requirements

- Node `^20.19.0 || >=22.12.0` (Vite 8 requirement)
- pnpm (the committed lockfile is version 9)

## Quick start

The backend is a separate repository, `php-auth`, and must be running first.

```bash
# in php-auth
composer install
mkdir -p db && touch db/data.db
composer setup   # migrations + seed + per-realm RSA keys
composer serve   # http://localhost:8000

# in this repository
pnpm install
pnpm dev
```

Open <http://localhost:5173/admin-ui/>. The `/admin-ui/` base path comes from
`vite.config.ts` and matches the deployed folder, not the repository name.

Sign-in is handled by the backend: the SPA redirects to the `admin` realm and
the backend serves the login form. The seeded dev operator is
`admin@example.com` / `ChangeMe!dev` (dev seed only — never a production
credential).

If the backend is not on `http://localhost:8000`, edit
[`public/config.json`](public/config.json):

| Key | Meaning |
|---|---|
| `auth.url` | Base URL of the php-auth server (without `/realms/<realm>`). |
| `auth.realm` | Realm used for the operator login, `admin` in dev. |
| `auth.clientId` | Public PKCE client, `admin-ui` in dev. |
| `app.apiHome` | Base URL prefixed to every `/admin/*` call. |

The file is fetched at runtime from `${BASE_URL}config.json`, so one build can
target different backends. It is copied into `dist/` as-is.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Vite dev server at `http://localhost:5173/admin-ui/`. |
| `pnpm build` | Typechecks with `tsc -b`, then builds `dist/`. |
| `pnpm preview` | Serves the production build locally. |
| `pnpm test` | Vitest in watch mode. |
| `pnpm vitest run` | One-shot test run (CI form). |
| `pnpm check-types` | `tsc -b`, no emit. |
| `pnpm check` | Biome lint and format check over `src`. |
| `pnpm check:fix` | Biome with autofixes. |

## How it works

- **Auth:** OIDC authorization code + PKCE against the `admin` realm.
  `keycloak-js` runs with `onLoad: "check-sso"` and PKCE `S256`; access and
  refresh tokens stay in memory. A reload re-authenticates silently through the
  SSO cookie. The SPA never stores tokens in `localStorage` and never renders a
  login form.
- **Authorization:** the admin API requires `realm_access.roles` to contain
  `admin`. Data-mode route loaders redirect to `/login` or `/forbidden` before a
  protected screen renders.
- **State:** Redux Toolkit is the single source of truth for session and server
  data. RTK Query and other external data layers are intentionally not used.
  Loaders dispatch fetch actions; slices own loading, error and applied
  pagination state. See [ADR-0003](docs/adr/0003-redux-single-source-of-truth.md).
- **API calls:** a typed fetch pipeline handles the base URL, the bearer token,
  a 401 refresh plus one retry, and the backend's
  `{ "error", "error_description" }` envelope. Contract types live in
  [`src/shared/api/contract.ts`](src/shared/api/contract.ts).

## Project layout

The project follows Feature-Sliced Design (ADR-0001). `widgets/`,
`features/` and `entities/` appear when their first slice does; nothing is
scaffolded ahead of the code that needs it.

```
src/
  app/          entry, router, store, operator model, layout, error boundary
  pages/        route-level screens (overview, login, forbidden, not-found)
  shared/
    api/        contract types and the typed fetch pipeline
    auth/       Keycloak adapter and the admin role constant
    config/     runtime config.json loading
    lib/        small helpers, hooks and typed store hooks
    ui/         vendored shadcn UI kit, Loader and Placeholder
  test/         test-only helpers (render, store factory, API spies)
```

## Documentation

- **Domain glossary:** [`CONTEXT.md`](CONTEXT.md) — the canonical terms (Realm, Client, User, Role, Session, Login, Offline session, Scope, Scope-role mapping, Audit entry, Operator).
- **API contract:** [`API-CONTRACT.md`](.scratch/admin-ui/API-CONTRACT.md) — every
  endpoint, payload, response shape, error slug, filter and delete guard. It is
  the source of truth for the wire format, and lives under the scratch folder
  because it is reference material, not an issue-tracker ticket.
- **Architecture decisions:** [`docs/adr/`](docs/adr/)
  - [0001 — Architecture and engineering conventions](docs/adr/0001-architecture-and-conventions.md)
  - [0002 — React Router data mode](docs/adr/0002-react-router-data-mode.md)
  - [0003 — Redux is the single source of truth](docs/adr/0003-redux-single-source-of-truth.md)
  - [0004 — Testing approach](docs/adr/0004-testing.md)
- **Agent conventions:** [`AGENTS.md`](AGENTS.md) and
  [`.agent/docs/`](.agent/docs/).

## Deployment

- `pnpm build` emits a static app under `dist/`, served from `/admin-ui/`.
- The host must rewrite unknown `/admin-ui/*` paths to `index.html`. Without
  that fallback, reloading a deep link (for example `/admin-ui/realms`) returns
  404. `vite preview` provides the fallback; a plain static folder does not.
- Replace `dist/config.json` per environment (or edit `public/config.json`
  before building) and pin the backend's `allowed_origins` to the deployed
  origin instead of `*`.

## License

[MIT](LICENSE) © 2026 emant
