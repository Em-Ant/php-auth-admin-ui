# 0004 — Testing approach

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The store holds all server state (ADR-0003) and routes fetch through loaders and
thunks (ADR-0002), which gives clear seams to test. The suite has to stay fast
and deterministic while still proving that a screen, its loader, its slice and
its user interactions work together — unit tests alone would miss the wiring
between those layers, and a browser E2E suite would be slower and flakier than
the risk justifies at this stage.

## Decision

We work **test-first**: new behaviour starts with a failing test, then the
minimal implementation, then refactoring with the test green. Bug fixes start
with a regression test that reproduces the bug.

Tests are colocated with the code as `*.test.ts` / `*.test.tsx` and run under
Vitest with jsdom. `vitest.config.ts` loads `src/setupTests.ts`, which owns
global setup such as Testing Library cleanup and the `matchMedia` stub.

**Current baseline.** The shell has a layout test and an auth-guard regression
test only. Reducer, helper and feature-flow tests arrive with the first data
slice and are required for that change. Those two tests still use the app
singleton; new tests create their own store and router. `vitest.config.ts`
contains coverage settings, but `@vitest/coverage-v8` is not installed yet, so
`--coverage` is unavailable until the dev dependency is added.

### Levels

| Level | What it covers | Tools |
|---|---|---|
| **Unit** | Reducers, pure helpers and selectors; hooks only when their logic is meaningful on its own | Vitest, `renderHook` where a hook is tested directly |
| **Component** | One component with its providers, rendered and driven like a user would drive it | Vitest, Testing Library, `user-event` |
| **Integration** | A whole feature flow: route → loader/thunk → store → UI → user action → refetch | `createMemoryRouter` with the real route table, a real store, Testing Library, `user-event`, API mocked at its boundary |

**Reducers and helpers.** Test the state transition directly, with no store and
no rendering: pending/fulfilled/rejected, request-id guards, pagination
read-back, merge and prune helpers. These are pure functions (ADR-0003), so the
tests are plain input/output assertions.

**Components.** These remain unit-scoped: one component and the providers it
needs, not a feature flow. Query by role, label or accessible name, never by
class name or DOM structure. Interactions go through `user-event`. The goal is
the rendered behaviour, not the implementation.

**Hooks.** A hook gets its own test only when it contains logic worth isolating
(derived values, subscriptions, guards). If a component test already exercises
it meaningfully, do not duplicate it as a hook test.

**Integration.** Integration tests are the acceptance bar for a feature. They
mock the **API boundary** (`appApiClient` / `rawApiClient`, or `fetch`), not
thunks, reducers or selectors, so the real store transitions and the real
loader wiring execute. Session concerns (`bootstrap`, `isAuthenticated`,
`hasRole`) are mocked at the auth boundary, as `src/routes.test.tsx` does.
Fixtures use the shapes from the API contract, including the
`{items,total,limit,offset}` envelope. A feature flow is considered covered when
the test starts from its route, loads data, exercises the main user actions and
asserts the resulting UI and store state.

### Rules

- Mock at the outermost boundary needed; never stub the thing under test.
- Use a fresh store (and router) per test where the code allows it, so tests do
  not depend on execution order.
- Prefer assertions on visible behaviour and user-observable state over
  snapshots; snapshots are not the primary assertion.
- No network, no real timers where avoidable, no sleeps. Use fake timers only
  for genuinely time-based logic.
- A failing test must name the behaviour that broke in its title.

## Consequences

- The suite runs in one process with no backend, so it stays fast and usable in
  the TDD loop.
- Pure reducers and helpers are cheap to cover exhaustively; the expensive
  coverage goes to the flows that actually break.
- Integration tests catch router, loader, store and component wiring mistakes
  that unit tests structurally cannot see.
- Mocking the API means contract drift is not caught here. The hand-maintained
  types in `src/api/contract.ts` and the backend's own tests are the guard.
- TDD costs time up front and pays back in fewer debug cycles; reviewers should
  expect tests in the same change as the behaviour.
- Component tests that assert accessibility names double as a check that the UI
  is usable with assistive technology.

## Revisit when

A browser E2E suite or a request-mocking layer such as MSW is adopted, coverage
gates are introduced, or React Router framework mode changes how routes and
loaders are mounted in tests.
