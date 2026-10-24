import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { DEFAULT_PAGE_SIZE } from "@/entities/realms";
import type { ListEnvelope, Role } from "@/shared/api/contract";
import {
  type CreateRoleInput,
  createRole,
  deleteRole,
  getRole,
  listRoles,
  type RolesApiError,
  type RolesListParams,
  type UpdateRoleInput,
  updateRole,
} from "./api";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface RolesState {
  items: Role[];
  total: number;
  limit: number;
  offset: number;
  listStatus: RequestStatus;
  listError: RolesApiError | null;
  listRequestId: string | null;
  detail: Role | null;
  detailStatus: RequestStatus;
  detailError: RolesApiError | null;
}

const initialState: RolesState = {
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

const toError = (error: unknown): RolesApiError =>
  (error as RolesApiError).status !== undefined
    ? (error as RolesApiError)
    : { status: null, message: (error as Error)?.message ?? "unknown error" };

const failed = (message?: string): RolesApiError => ({
  status: null,
  message: message ?? "unknown error",
});

export const fetchRoles = createAsyncThunk<
  ListEnvelope<Role>,
  RolesListParams,
  { rejectValue: RolesApiError }
>("roles/fetchList", async (params, { rejectWithValue }) => {
  try {
    return await listRoles(params);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const fetchRoleById = createAsyncThunk<
  Role,
  string,
  { rejectValue: RolesApiError }
>("roles/fetchOne", async (id, { rejectWithValue }) => {
  try {
    return await getRole(id);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const createRoleThunk = createAsyncThunk<
  Role,
  CreateRoleInput,
  { rejectValue: RolesApiError }
>("roles/create", async (input, { rejectWithValue }) => {
  try {
    return await createRole(input);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const updateRoleThunk = createAsyncThunk<
  Role,
  { id: string; input: UpdateRoleInput },
  { rejectValue: RolesApiError }
>("roles/update", async ({ id, input }, { rejectWithValue }) => {
  try {
    return await updateRole(id, input);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const deleteRoleThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: RolesApiError }
>("roles/delete", async (id, { rejectWithValue }) => {
  try {
    await deleteRole(id);
    return id;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const rolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state, action) => {
        state.listStatus = "loading";
        state.listError = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.listStatus = "succeeded";
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.listStatus = "failed";
        state.listError = action.payload ?? failed(action.error.message);
      })
      .addCase(fetchRoleById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(fetchRoleById.fulfilled, (state, action) => {
        state.detail = action.payload;
        state.detailStatus = "succeeded";
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload ?? failed(action.error.message);
      })
      .addCase(updateRoleThunk.fulfilled, (state, action) => {
        if (state.detail?.id === action.payload.id) {
          state.detail = action.payload;
        }
      })
      .addCase(deleteRoleThunk.fulfilled, (state) => {
        state.detail = null;
      });
  },
});

export const rolesReducer = rolesSlice.reducer;
