# 0003 — Redux is the single source of truth

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The admin UI reads and mutates data from the php-auth admin API and needs one
predictable place to hold it. Several patterns were available: router loaders
returning data, RTK Query, or a separate client-side cache (TanStack Query,
SWR). Mixing them would leave the same realm, client or user duplicated in
more than one layer with no clear owner.

## Decision

The Redux store is the single source of truth for all application state,
including server data.

- Redux Toolkit is used for the store itself (`createSlice`,
  `createAsyncThunk`, listener middleware). **RTK Query is not used**, and
  neither is any other external data-fetching/caching layer. This decision
  rules out RTK Query, not Redux Toolkit.
- Route loaders may dispatch fetch actions, and they own navigation concerns
  such as the admin guard and redirects. They do not return or hold data, and
  they are not treated as a cache: a loader dispatching a thunk is just the
  navigation-triggered way to refresh the store.
- Components read server data through selectors. They do not keep a parallel
  copy of an entity in local component state.
- Loading, error and pagination state for a fetch live in its slice, including
  a request-id guard so a slow stale response cannot overwrite a newer one.
- After a mutation, refetch the affected slice by dispatching its thunk again.
  There is no automatic cache invalidation.

### Slice placement

Under FSD (ADR-0001), a server-backed slice lives in `entities/<model>` —
`realms`, `clients`, `users`, `roles`, `sessions`, `logins`,
`offline-sessions`, `audit-logs` — because more than one page reads it. A slice
that exists only for a single user action lives in `features/<action>`. An
entity slice keeps `api.ts` (endpoint calls), `slice.ts` (state and thunks),
`selectors.ts`, a public `index.ts` and colocated tests; pages and components
import it only through `index.ts`.

Session and bootstrap state belong to the app layer. The current
`features/user` slice is a documented pre-FSD exception: it stays where it is
until an app layer exists, and pages read it directly in the meantime.

## Store rules

The store is a pure state machine that is independent of the UI. The UI reads
it through selectors and changes it by dispatching actions; it never reaches
into slice state directly.

- **Reducers stay pure.** Same state and action in, same state out. No I/O, no
  async work, no reads of clocks or randomness, no navigation, no DOM or
  component references. Immer's mutation syntax inside `createSlice` is a
  convenience, not permission to mutate state anywhere else.
- **One action, one simple mutation.** The preferred reducer is a short,
  local update. When an update needs more than a few lines — merging a page
  into a list, deriving a field, pruning stale entries — extract a named pure
  helper next to the slice, unit-test it, and call it from the reducer. The
  reducer stays readable and the logic stays testable without a store.
- **Cross-slice reads belong in a thunk.** If an update needs data from
  another slice, the thunk reads it from `getState()` through that slice's
  selector. Do not read slice A at the dispatch site and pass a copy of its
  data into an action for slice B: the action payload describes the intent or
  input, and the thunk resolves what it needs. This keeps payloads small and
  stops a component's view of two slices from becoming hidden coupling.
- **Actions are not UI events.** Payloads carry the intent and the minimum
  plain data needed to apply it. State stays serializable: no router objects,
  DOM nodes, functions, class instances or component references in the store.
- **The dependency points from UI to store.** Slices, thunks and selectors may
  import API clients, runtime config and auth helpers; they must not import
  React, React Router or anything from `src/pages` or `src/components`. A
  screen can be deleted without touching the store, and the store can be
  exercised in a test without rendering a component.

## Consequences

- Every screen has one obvious place to look when data is wrong, and the
  Redux DevTools timeline covers reads, writes and failures.
- Pagination and filter *intent* stays in the URL (ADR-0002); the slice stores
  the values the API applied and echoed back. There is one source for what was
  requested and one for what was applied, and no cache copying either.
- Without a query cache we write more boilerplate per resource
  (pending/fulfilled/rejected handling) and must decide explicitly when to
  refetch. Stale data stays stale until a loader or action refreshes it.
- Loaders must not become a second data source. If a screen needs data, it
  dispatches an action; returning entities from a loader contradicts this ADR.
- Reducers stay small and reviewable, and non-trivial state logic is covered
  by plain function tests rather than through the UI.
- Cross-slice workflows are centralized in thunks. That adds a layer compared
  with doing the work at the dispatch site, and is intentional: it keeps
  components from knowing how slices relate.
- The store has no UI dependency, so it can be reused by loaders, listener
  middleware or future non-browser entry points without change.

## Revisit when

Caching, deduplication or background-refetch needs outgrow the slice-by-slice
approach. Replacing this with RTK Query or another cache would be a new ADR,
not an incremental refactor.
