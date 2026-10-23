# 0001 — Architecture and engineering conventions

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The app is a browser-only admin SPA for the php-auth admin API and is growing
screen by screen. It started from the react-playground base and was reshaped
around the Keycloak-compatible OIDC contract and the shadcn component set. As
slices accumulate, an explicit layer boundary and a shared code style matter
more than any single library choice: they decide whether a screen can be
changed, tested and deleted without ripples.

## Decision

### Architecture — Feature-Sliced Design

We follow Feature-Sliced Design (FSD) layering:

- **`shared`** — framework-agnostic utilities, the UI kit, API primitives and
  runtime config. Depends on nothing above it.
- **`entities`** — domain models shared by more than one feature: types,
  selectors, slices and API clients, one folder per entity. Added when a second
  feature needs the same thing, not speculatively.
- **`features`** — a user-facing action and the state it needs, one slice per
  feature (for example "assign role"). Each slice exposes a public entry point
  (`index.ts`) and keeps its internals private.
- **`widgets`** — compositions of entities/features reused by more than one
  page. Only created when a second page needs the composition.
- **`pages`** — route-level screens. They compose widgets/features/entities and
  hold no business logic of their own.
- **`app`** — the composition root: router, store, providers, bootstrap and
  global styles.

**Import direction is one-way:** `app → pages → widgets → features → entities →
shared`. A lower layer never imports a higher one, and slices at the same layer
never import each other's internals — only through the public entry point. No
empty layers: a folder appears when its first slice does.

The tree follows those layers with no root-level catch-alls: `app/` (entry,
router, store, the operator model, layout and error boundary), `pages/` (one
folder per screen), `shared/` (`api`, `auth`, `config`, `lib`, `ui`) and
`src/test/` as test-only tooling outside the layers. `widgets/`, `features/`
and `entities/` appear when their first slice does — a layer folder is never
created empty, and a slice is never scaffolded ahead of the code that needs it.
When an existing unit must move, move it with the change that needs it rather
than restructuring unrelated code.

### Engineering style

We write clean code in the Kent Beck tradition, with KISS, DRY and SOLID as
working rules rather than slogans.

- **Single responsibility first.** A React component or helper has one reason
  to change. When a component mixes data orchestration, layout and interaction,
  split it into a container/feature unit, presentational units and extracted
  helpers or hooks. The same applies to a helper that both decides and formats.
- **Small units, small interfaces.** Split large files into focused sub-units.
  Keep prop and argument lists short and return shapes narrow; group related
  values into a named type instead of adding positional booleans or another
  "options" bag. A unit whose inputs need a paragraph to explain is a design
  smell — split it rather than document it.
- **KISS and YAGNI.** Do the simplest thing that meets the requirement. Do not
  add abstractions for a second caller that does not exist yet. DRY protects
  duplicated *knowledge*; incidental similarity is not a reason to couple two
  things.
- **Low cyclomatic complexity.** Prefer guard clauses and early returns over
  nested conditionals. Avoid nested loops and nested conditionals; extract
  predicates, use `map`/`filter`/`find` pipelines and compute derived values
  before JSX instead of inline expression chains. If control flow needs a
  comment to explain it, extract a named unit.
- **Never nest ternaries.** A nested ternary is always replaced by a variable,
  a helper or a small component. One level of ternary is acceptable only when
  it is immediately obvious.
- **Names carry the domain.** Use the vocabulary from `CONTEXT.md` and the
  handoff docs; comments explain *why*, not *what*.
- **No dead weight.** Remove unused code, props, exports and dependencies
  rather than leaving them "for later".
- **Tests follow ADR-0004.** Pure reducers and helpers make the style
  enforceable: if a unit is hard to test in isolation, it is usually doing too
  much.

### Stack choices

| Concern | Choice | Why |
|---|---|---|
| UI runtime | React 19 + React DOM | Current stable, required by the shadcn components. |
| Language | TypeScript 6, strict, project references | Types are the contract with the admin API; `tsc -b` is the typecheck and build gate. |
| Build/dev | Vite 8 + `@vitejs/plugin-react` | Fast dev server, static build, no SSR requirement. The base is `/admin-ui/` because the app is deployed in its own folder; a dev proxy for `/api` exists but the app uses `apiHome` from runtime config. |
| Package manager | pnpm | Lockfile is committed; single tool for install, scripts and workspace-friendly layout. |
| Routing | React Router 7 in data mode | Guards and redirects resolve before render. Details are in ADR-0002. |
| Application state | Redux Toolkit 2 + React Redux 9 | Single source of truth for session and server data; ADR-0003. RTK Query is deliberately absent. |
| Authentication | `keycloak-js` 26 | The backend already implements Keycloak-compatible OIDC. PKCE `S256`, `onLoad: check-sso`, login iframe disabled. Access and refresh tokens stay in memory; `offline_access` is never requested. The login form is served by the backend, not built here. |
| Runtime config | `public/config.json`, fetched at boot via `import.meta.env.BASE_URL` | One build can point at different backends; changing a URL does not require a rebuild. |
| Component library | shadcn/ui (style `radix-nova`, neutral, CSS variables) | Components are vendored source under `src/shared/ui`, so they can be edited and are not a runtime dependency on a design system. |
| Primitives | `radix-ui` umbrella package | What the shadcn components import; accessible behaviour is not reimplemented. |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite`, `tw-animate-css` | CSS-first Tailwind 4 setup; theme tokens live in `src/app/styles/index.css`. |
| Class helpers | `class-variance-authority`, `cn` | Shadcn conventions for variants and class merging. |
| Fonts | `@fontsource-variable/geist` | Self-hosted variable font, no external font request. |
| Icons | `lucide-react` | Shadcn default, tree-shakeable. |
| HTTP layer | Custom `typedFetch` → `withBaseUrl` → `withAuth`, with `rexult` `Result` | One pipeline for every call: absolute/relative URLs, the `Authorization` header, 401 refresh plus a single retry, and mapping of the php-auth `{error, error_description}` envelope. Failures are values, not exceptions (abort is the exception). |
| API types | Hand-maintained `src/shared/api/contract.ts` | The backend contract is documented, not generated; types are updated when the contract changes, one type per resource in the single contract module. |
| Lint/format | Biome 2 | One tool for both; generated shadcn components and hooks are excluded from its rules. |
| Tests | Vitest 4, Testing Library, jest-dom, jsdom | Fast unit/component tests, colocated with source; `src/setupTests.ts` owns global stubs such as `matchMedia`. See ADR-0004. |

## Consequences

- Layer direction keeps imports acyclic and lets a screen or feature be deleted
  without leaving dead dependencies behind.
- Small units with narrow interfaces are easier to test (ADR-0004) and easier
  for both humans and agents to review.
- Flattened control flow and a ban on nested ternaries make review rules
  mechanical; reviewers can reject violations without a style debate.
- FSD and the style rules are enforced by review, not by tooling, until a lint
  rule is added for layer imports and complexity.
- Splitting units increases the file count. That is accepted in exchange for
  single-responsibility units.
- The stack table remains the reference for why each dependency exists;
  removal of an unused package is a normal cleanup, not an ADR.

## Revisit when

The app splits into multiple deployable contexts (then the domain docs become
multi-context), a framework-mode or SSR move changes the layer boundaries, or
tooling is introduced to enforce FSD imports and complexity limits.
