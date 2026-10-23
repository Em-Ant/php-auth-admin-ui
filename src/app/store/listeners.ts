import {
  createListenerMiddleware,
  type TypedStartListening,
} from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "./store";

export const listenerMiddleware = createListenerMiddleware();
export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening =
  listenerMiddleware.startListening as AppStartListening;

export type AppListenerFn = (listen: AppStartListening) => void;

export function combineListeners(listeners: AppListenerFn[]) {
  for (const listenerFn of listeners) {
    listenerFn(startAppListening);
  }
}
