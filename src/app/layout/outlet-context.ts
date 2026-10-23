/**
 * What the shell hands to every routed page. `app` owns the operator state
 * (ADR-0003), so pages receive it here instead of importing the app layer.
 */
export interface OperatorOutletContext {
  name: string | null;
  roles: string[];
}
