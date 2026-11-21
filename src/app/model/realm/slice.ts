import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { readStoredRealm } from "./storage";

export interface ActiveRealm {
  id: string;
  name: string;
}

export interface RealmState {
  id: string | null;
  name: string | null;
}

const stored = readStoredRealm();

const initialState: RealmState = {
  id: stored?.id ?? null,
  name: stored?.name ?? null,
};

export const realmSlice = createSlice({
  name: "realm",
  initialState,
  reducers: {
    setActiveRealm: (state, { payload }: PayloadAction<ActiveRealm>) => {
      state.id = payload.id;
      state.name = payload.name;
    },
    clearActiveRealm: (state) => {
      state.id = null;
      state.name = null;
    },
  },
});

export const { setActiveRealm, clearActiveRealm } = realmSlice.actions;

export const realmReducer = realmSlice.reducer;
