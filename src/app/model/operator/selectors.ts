import type { OperatorState } from "./slice";

/**
 * Typed against the slice's own state shape, not the root state, so the
 * selectors never import the store and the store can import the slice.
 */
interface StateWithOperator {
  operator: OperatorState;
}

export const selectOperatorName = (state: StateWithOperator) =>
  state.operator.name;

export const selectOperatorRoles = (state: StateWithOperator) =>
  state.operator.roles;
