import type { AppListenerFn } from "@/app/store/listeners";
import {
  deleteRealmThunk,
  fetchRealmOptions,
  selectRealmOptions,
} from "@/entities/realms";
import { resolveActiveRealm } from "./resolve";
import { selectActiveRealmId } from "./selectors";
import { clearActiveRealm, setActiveRealm } from "./slice";
import { clearStoredRealm, writeStoredRealm } from "./storage";

export const registerRealmListeners: AppListenerFn = (listen) => {
  listen({
    actionCreator: setActiveRealm,
    effect({ payload }) {
      writeStoredRealm(payload);
    },
  });

  listen({
    actionCreator: clearActiveRealm,
    effect() {
      clearStoredRealm();
    },
  });

  // The catalog decides whether the stored realm still exists: resolve the
  // default once it arrives, on first load and after a realm is deleted.
  listen({
    actionCreator: fetchRealmOptions.fulfilled,
    effect(_action, { dispatch, getState }) {
      if (selectRealmOptions(getState()).length > 0) {
        void dispatch(resolveActiveRealm());
      }
    },
  });

  listen({
    actionCreator: deleteRealmThunk.fulfilled,
    effect({ payload: deletedId }, { dispatch, getState }) {
      if (selectActiveRealmId(getState()) === deletedId) {
        dispatch(clearActiveRealm());
      }
    },
  });
};
