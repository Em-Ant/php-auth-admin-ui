import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface OperatorState {
  name: string | null;
  roles: string[];
}

interface OperatorPayload {
  name: string;
  roles: string[];
}

const initialState: OperatorState = {
  name: null,
  roles: [],
};

export const operatorSlice = createSlice({
  name: "operator",
  initialState,
  reducers: {
    requestLogin: () => {
      /* noop */
    },
    requestLogout: () => {
      /* noop */
    },
    setOperator: (state, { payload }: PayloadAction<OperatorPayload>) => {
      state.name = payload.name;
      state.roles = payload.roles;
    },
  },
});

export const { requestLogin, requestLogout, setOperator } =
  operatorSlice.actions;

export const operatorReducer = operatorSlice.reducer;
