import type { AppListenerFn } from "@/app/store/listeners";
import { getUser, login, logout } from "@/shared/auth";
import { requestLogin, requestLogout, setOperator } from "./slice";

export const registerOperatorListeners: AppListenerFn = (listen) => {
  listen({
    actionCreator: requestLogin,
    async effect(_, { dispatch }) {
      await login();
      dispatch(setOperator(await getUser()));
    },
  });

  listen({
    actionCreator: requestLogout,
    async effect() {
      await logout();
    },
  });
};
