import { registerOperatorListeners } from "@/app/model/operator";
import { combineListeners } from "./listeners";

const listeners = [registerOperatorListeners];

export const setupAppListeners = () => {
  combineListeners(listeners);
};

export * from "./store";
