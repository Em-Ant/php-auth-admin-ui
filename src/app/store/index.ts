import { registerOperatorListeners } from "@/app/model/operator";
import { registerRealmListeners } from "@/app/model/realm";
import { combineListeners } from "./listeners";

const listeners = [registerOperatorListeners, registerRealmListeners];

let registered = false;

/**
 * Called once at startup (main.tsx). Idempotent so tests that simulate
 * startup can call it without double-registering effects.
 */
export const setupAppListeners = () => {
  if (registered) {
    return;
  }
  registered = true;
  combineListeners(listeners);
};

export * from "./store";
