import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { DEFAULT_PAGE_SIZE } from "@/entities/realms";
import type { AuditLogEntry, ListEnvelope } from "@/shared/api/contract";
import {
  type AuditLogsApiError,
  type AuditLogsListParams,
  getAuditLog,
  listAuditLogs,
  type PurgeAuditLogsInput,
  purgeAuditLogs,
} from "./api";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface AuditLogsState {
  items: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
  listStatus: RequestStatus;
  listError: AuditLogsApiError | null;
  listRequestId: string | null;
  detail: AuditLogEntry | null;
  detailStatus: RequestStatus;
  detailError: AuditLogsApiError | null;
}

const initialState: AuditLogsState = {
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

const toError = (error: unknown): AuditLogsApiError =>
  (error as AuditLogsApiError).status !== undefined
    ? (error as AuditLogsApiError)
    : { status: null, message: (error as Error)?.message ?? "unknown error" };

const failed = (message?: string): AuditLogsApiError => ({
  status: null,
  message: message ?? "unknown error",
});

export const fetchAuditLogs = createAsyncThunk<
  ListEnvelope<AuditLogEntry>,
  AuditLogsListParams,
  { rejectValue: AuditLogsApiError }
>("auditLogs/fetchList", async (params, { rejectWithValue }) => {
  try {
    return await listAuditLogs(params);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const fetchAuditLogById = createAsyncThunk<
  AuditLogEntry,
  string,
  { rejectValue: AuditLogsApiError }
>("auditLogs/fetchOne", async (id, { rejectWithValue }) => {
  try {
    return await getAuditLog(id);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const purgeAuditLogsThunk = createAsyncThunk<
  number,
  PurgeAuditLogsInput,
  { rejectValue: AuditLogsApiError }
>("auditLogs/purge", async (input, { rejectWithValue }) => {
  try {
    return (await purgeAuditLogs(input)).deleted;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const auditLogsSlice = createSlice({
  name: "auditLogs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state, action) => {
        state.listStatus = "loading";
        state.listError = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.listStatus = "succeeded";
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.listStatus = "failed";
        state.listError = action.payload ?? failed(action.error.message);
      })
      .addCase(fetchAuditLogById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(fetchAuditLogById.fulfilled, (state, action) => {
        state.detail = action.payload;
        state.detailStatus = "succeeded";
      })
      .addCase(fetchAuditLogById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload ?? failed(action.error.message);
      });
  },
});

export const auditLogsReducer = auditLogsSlice.reducer;
