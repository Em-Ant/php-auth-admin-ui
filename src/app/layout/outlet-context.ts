import type { ActiveRealm } from "@/app/model/realm";

/**
 * What the shell hands to every routed page. `app` owns the operator and the
 * active realm (ADR-0003), so pages receive them here instead of importing the
 * app layer.
 */
export interface ShellOutletContext {
  name: string | null;
  roles: string[];
  activeRealmId: string | null;
  activeRealmName: string | null;
  activateRealm: (realm: ActiveRealm) => void;
}
