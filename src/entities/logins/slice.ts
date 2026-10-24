import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { DEFAULT_PAGE_SIZE } from "@/entities/realms";
import type { ListEnvelope, Login } from "@/shared/api/contract";
import {
  deleteLogin,
  type LoginsApiError,
  type LoginsListParams,
  listLogins,
} from "./api";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface LoginsState {
  items: Login[];
  total: number;
  limit: number;
  offset: number;
  listStatus: RequestStatus;
  listError: LoginsApiError | null;
  listRequestId: string | null;
}

const initialState: LoginsState = {
  items: [],
  total: 0,
  limit: DEFAULT_PAGE_SIZE,
  offset: 0,
  listStatus: "idle",
  listError: null,
  listRequestId: null,
};

const toError = (error: unknown): LoginsApiError =>
  (error as LoginsApiError).status !== undefined
    ? (error as LoginsApiError)
    : { status: null, message: (error as Error)?.message ?? "unknown error" };

const failed = (message?: string): LoginsApiError => ({
  status: null,
  message: message ?? "unknown error",
});

export const fetchLogins = createAsyncThunk<
  ListEnvelope<Login>,
  LoginsListParams,
  { rejectValue: LoginsApiError }
>("logins/fetchList", async (params, { rejectWithValue }) => {
  try {
    return await listLogins(params);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const deleteLoginThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: LoginsApiError }
>("logins/delete", async (id, { rejectWithValue }) => {
  try {
    await deleteLogin(id);
    return id;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const loginsSlice = createSlice({
  name: "logins",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogins.pending, (state, action) => {
        state.listStatus = "loading";
        state.listError = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchLogins.fulfilled, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.listStatus = "succeeded";
      })
      .addCase(fetchLogins.rejected, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.listStatus = "failed";
        state.listError = action.payload ?? failed(action.error.message);
      })
      .addCase(deleteLoginThunk.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (entry) => entry.id !== action.payload,
        );
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export const loginsReducer = loginsSlice.reducer;
