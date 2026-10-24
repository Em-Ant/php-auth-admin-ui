import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { DEFAULT_PAGE_SIZE } from "@/entities/realms";
import type { ListEnvelope, OfflineSession } from "@/shared/api/contract";
import {
  getOfflineSession,
  listOfflineSessions,
  type OfflineSessionsApiError,
  type OfflineSessionsListParams,
  revokeOfflineSession,
} from "./api";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface OfflineSessionsState {
  items: OfflineSession[];
  total: number;
  limit: number;
  offset: number;
  listStatus: RequestStatus;
  listError: OfflineSessionsApiError | null;
  listRequestId: string | null;
  detail: OfflineSession | null;
  detailStatus: RequestStatus;
  detailError: OfflineSessionsApiError | null;
}

const initialState: OfflineSessionsState = {
  items: [],
  total: 0,
  limit: DEFAULT_PAGE_SIZE,
  offset: 0,
  listStatus: "idle",
  listError: null,
  listRequestId: null,
  detail: null,
  detailStatus: "idle",
  detailError: null,
};

const toError = (error: unknown): OfflineSessionsApiError =>
  (error as OfflineSessionsApiError).status !== undefined
    ? (error as OfflineSessionsApiError)
    : { status: null, message: (error as Error)?.message ?? "unknown error" };

const failed = (message?: string): OfflineSessionsApiError => ({
  status: null,
  message: message ?? "unknown error",
});

export const fetchOfflineSessions = createAsyncThunk<
  ListEnvelope<OfflineSession>,
  OfflineSessionsListParams,
  { rejectValue: OfflineSessionsApiError }
>("offlineSessions/fetchList", async (params, { rejectWithValue }) => {
  try {
    return await listOfflineSessions(params);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const fetchOfflineSessionById = createAsyncThunk<
  OfflineSession,
  string,
  { rejectValue: OfflineSessionsApiError }
>("offlineSessions/fetchOne", async (id, { rejectWithValue }) => {
  try {
    return await getOfflineSession(id);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const revokeOfflineSessionThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: OfflineSessionsApiError }
>("offlineSessions/revoke", async (id, { rejectWithValue }) => {
  try {
    await revokeOfflineSession(id);
    return id;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const offlineSessionsSlice = createSlice({
  name: "offlineSessions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOfflineSessions.pending, (state, action) => {
        state.listStatus = "loading";
        state.listError = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchOfflineSessions.fulfilled, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.listStatus = "succeeded";
      })
      .addCase(fetchOfflineSessions.rejected, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.listStatus = "failed";
        state.listError = action.payload ?? failed(action.error.message);
      })
      .addCase(fetchOfflineSessionById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(fetchOfflineSessionById.fulfilled, (state, action) => {
        state.detail = action.payload;
        state.detailStatus = "succeeded";
      })
      .addCase(fetchOfflineSessionById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload ?? failed(action.error.message);
      })
      .addCase(revokeOfflineSessionThunk.fulfilled, (state, action) => {
        const item = state.items.find((entry) => entry.id === action.payload);
        if (item) {
          item.status = "EXPIRED";
        }
        if (state.detail?.id === action.payload) {
          state.detail.status = "EXPIRED";
        }
      });
  },
});

export const offlineSessionsReducer = offlineSessionsSlice.reducer;
