import { getUser, login, logout } from "../../bootstrap/auth";
import type { AppListenerFn } from "../../store/listeners";
import { requestLogin, requestLogout, setLoggedInUser } from "./slice";

export const loginListener: AppListenerFn = (listen) => {
  listen({
    actionCreator: requestLogin,
    async effect(_, { dispatch }) {
      await login();
      dispatch(setLoggedInUser(await getUser()));
    },
  });
};

export const logoutListener: AppListenerFn = (listen) => {
  listen({
    actionCreator: requestLogout,
    async effect() {
      await logout();
    },
  });
};
