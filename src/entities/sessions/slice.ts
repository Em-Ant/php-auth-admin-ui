import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { DEFAULT_PAGE_SIZE } from "@/entities/realms";
import type { ListEnvelope, Session } from "@/shared/api/contract";
import {
  type InvalidateSessionsInput,
  invalidateSessions,
  listSessions,
  revokeSession,
  type SessionsApiError,
  type SessionsListParams,
} from "./api";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface SessionsState {
  items: Session[];
  total: number;
  limit: number;
  offset: number;
  listStatus: RequestStatus;
  listError: SessionsApiError | null;
  listRequestId: string | null;
}

const initialState: SessionsState = {
  items: [],
  total: 0,
  limit: DEFAULT_PAGE_SIZE,
  offset: 0,
  listStatus: "idle",
  listError: null,
  listRequestId: null,
};

const toError = (error: unknown): SessionsApiError =>
  (error as SessionsApiError).status !== undefined
    ? (error as SessionsApiError)
    : { status: null, message: (error as Error)?.message ?? "unknown error" };

const failed = (message?: string): SessionsApiError => ({
  status: null,
  message: message ?? "unknown error",
});

export const fetchSessions = createAsyncThunk<
  ListEnvelope<Session>,
  SessionsListParams,
  { rejectValue: SessionsApiError }
>("sessions/fetchList", async (params, { rejectWithValue }) => {
  try {
    return await listSessions(params);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const revokeSessionThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: SessionsApiError }
>("sessions/revoke", async (id, { rejectWithValue }) => {
  try {
    await revokeSession(id);
    return id;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const invalidateSessionsThunk = createAsyncThunk<
  number,
  InvalidateSessionsInput,
  { rejectValue: SessionsApiError }
>("sessions/invalidate", async (input, { rejectWithValue }) => {
  try {
    return (await invalidateSessions(input)).invalidated;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state, action) => {
        state.listStatus = "loading";
        state.listError = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.listStatus = "succeeded";
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.listStatus = "failed";
        state.listError = action.payload ?? failed(action.error.message);
      })
      .addCase(revokeSessionThunk.fulfilled, (state, action) => {
        const session = state.items.find(
          (entry) => entry.id === action.payload,
        );
        if (session) {
          session.status = "EXPIRED";
        }
      });
  },
});

export const sessionsReducer = sessionsSlice.reducer;
