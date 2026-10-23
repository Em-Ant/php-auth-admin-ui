import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  name: string | null;
  roles: string[];
  loggedIn: boolean;
}

interface UserPayload {
  name: string;
  roles: string[];
}

const initialState: UserState = {
  loggedIn: false,
  name: null,
  roles: [],
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    requestLogin: () => {
      /* noop */
    },
    requestLogout: () => {
      /* noop */
    },
    setLoggedInUser: (state, { payload: user }: PayloadAction<UserPayload>) => {
      state.name = user.name;
      state.roles = user.roles;
      state.loggedIn = true;
    },
  },
});

export const { setLoggedInUser, requestLogin, requestLogout } =
  userSlice.actions;

export default userSlice.reducer;
