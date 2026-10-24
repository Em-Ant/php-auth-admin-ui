## Agent skills

### Issue tracker

This repo uses local markdown issue tracking under `.scratch/`. See `.agent/docs/issue-tracker.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `.agent/docs/domain.md`.

## Engineering conventions

- **Architecture:** Feature-Sliced Design (ADR-0001). Imports point one way, `app → pages → widgets → features → entities → shared`; a slice exposes a public entry and never imports another slice's internals. The tree already follows the layers — `app/` (entry, router, store, operator model, layout, error), `pages/`, `shared/` (`api`, `auth`, `config`, `lib`, `ui`) — with `src/test/` outside them. `widgets/`, `features/` and `entities/` are created with their first slice, never scaffolded empty.
- **State:** Redux Toolkit is the single source of truth; no RTK Query or other external data layer. Loaders dispatch actions and do not own data (ADR-0003).
- **Selectors:** prefer selectors that return primitives; when an object or array is unavoidable, memoize it with `createSelector` so the reference stays stable — including for empty results (ADR-0003).
- **Routing:** React Router data mode; loaders handle guards and dispatch fetches (ADR-0002).
- **Tests:** TDD. Unit-test reducers and helpers, integration-test full feature flows with Testing Library and `user-event` against a mocked API (ADR-0004). Shared test helpers live in `src/test/`.
- **Code style:** clean code / Kent Beck, KISS, DRY, SOLID with single responsibility for components and helpers. Keep units small with short prop/argument lists and narrow returns. Never nest ternaries. Use guard clauses and early returns, avoid nested loops and conditionals, and keep cyclomatic complexity low.
- **Decisions:** read the relevant ADR in `docs/adr/` before changing a documented convention.
- **Handoff docs:** `.scratch/admin-ui/` holds the read-only project handoff and API docs. It is reference material, not an issue-tracker feature folder.

### Suggested skills

Before non-trivial implementation or review, load `clean-code`, `kent-beck-style` and `j-space`. If the requirements or scope are unclear, use `grill-me` before writing code.
