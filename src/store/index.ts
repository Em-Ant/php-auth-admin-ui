import { loginListener, logoutListener } from "../features/user/listeners";
import { combineListeners } from "./listeners";

export const setupAppListeners = () => {
  combineListeners([loginListener, logoutListener]);
};

export * from "./hooks";
export * from "./store";
