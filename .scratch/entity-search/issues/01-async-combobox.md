# 01 — Async combobox and per-entity search thunks

- **Status:** Todo
- **Depends on:** —
- **Blocks:** 02, 03

## Context

The picker has two independent halves: a presentational combobox and the
domain-specific search state. Splitting them keeps `shared/` free of domain
knowledge and lets the page own the realm scope (ADR-0001).

## Scope

### `src/shared/ui/combobox.tsx` (presentational, no domain)

- Built on the existing Radix primitive in `src/shared/ui/select.tsx` or a Radix
  `Popover` + listbox; add `src/shared/ui/popover.tsx` if not present.
- Props: `value`, `onChange`, `options: { id, label }[]`, `query`,
  `onQueryChange`, `placeholder`, `allLabel`, `emptyLabel`, `loading`, `error`,
  `disabled`.
- ARIA: `role="combobox"` with `aria-expanded`, `aria-controls`,
  `aria-activedescendant`; the list is `role="listbox"`, items `role="option"`
  with `aria-selected`.
- Keyboard: ↑/↓ move the active option, Enter selects, Esc closes and restores,
  Home/End jump, typing edits the query.
- States: loading spinner, “No matches”, and an inline error — all inside the
  popover, never a silent blank list.
- An explicit “All users/clients/roles” item (when `allLabel` is given) clears
  the value.

### `src/widgets/entity-picker/EntityPicker.tsx` (domain-agnostic composer)

- Props: `label`, `value`, `onChange`, `allLabel?`, `placeholder?`,
  `disabled?`, and `search: (q: string) => void`, plus the state selectors or
  props the page passes (`items`, `status`, `error`).
- Debounces the input (~250 ms) before calling `search`.
- When `value` is set and not in `items`, resolves the label via a
  `resolveLabel?: (id: string) => void` callback the page wires to the
  entity's `fetch*ById` thunk (deep-link hydration).
- Switching the page's realm scope (a new `search` adapter identity) resets the
  query and clears stale options.

### Per-entity search state (`entities/users`, `entities/clients`, `entities/roles`)

- Add to each slice: `searchItems`, `searchStatus`, `searchError`,
  `searchRequestId`, `searchTotal`, and a `search*` thunk
  (`searchUsers`, `searchClients`, `searchRoles`) taking
  `{ realm_id?, client_id?, q, limit }`.
- Keep it **separate from `items`** so a typeahead does not overwrite the table.
- Guard with `searchRequestId` exactly like `listRequestId` already guards the
  list (drop results from a superseded request).
- Primitive selectors for status/error; a `createSelector` for the items array
  (ADR-0003).
- `searchRoles` also takes `client_id` so the client dialog can scope roles to
  one client.

## Acceptance criteria

- The combobox is fully keyboard-operable and exposes the expected `aria-*`
  attributes; it is usable with no pointer.
- A slow first query cannot overwrite a newer one (request-id guard).
- Clearing the query and selecting “All …” both clear the value.
- A `value` not present in `items` renders its resolved label, not a raw id.
- No domain import inside `shared/ui/combobox`; no React Router import in the
  slices.

## Tests

- Component: keyboard navigation, `aria-*` assertions, loading/empty/error
  states, debounce, stale-response ordering.
- Slice: `search*` thunk happy path and rejection; the request-id guard; the
  search bucket does not touch `items`.
- Helper: label-resolution path when the id is absent from the first page.

## Out of scope

Swapping screens (issue 02) and the server `q` for roles (issue 03).
