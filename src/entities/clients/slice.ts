import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { DEFAULT_PAGE_SIZE } from "@/entities/realms";
import type {
  Client,
  ListEnvelope,
  ScopeRoleMapping,
} from "@/shared/api/contract";
import {
  type AddScopeRoleInput,
  addScopeRole,
  type ClientsApiError,
  type ClientsListParams,
  type CreateClientInput,
  createClient,
  deleteClient,
  deleteScopeRole,
  getClient,
  listClients,
  listScopeRoles,
  type UpdateClientInput,
  updateClient,
  updateScopeRole,
} from "./api";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface ClientsState {
  items: Client[];
  total: number;
  limit: number;
  offset: number;
  listStatus: RequestStatus;
  listError: ClientsApiError | null;
  listRequestId: string | null;
  detail: Client | null;
  detailStatus: RequestStatus;
  detailError: ClientsApiError | null;
  scopeRoles: ScopeRoleMapping[];
  scopeRolesStatus: RequestStatus;
  scopeRolesError: ClientsApiError | null;
  mutationStatus: "idle" | "saving" | "succeeded" | "failed";
  mutationError: ClientsApiError | null;
}

const initialState: ClientsState = {
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
  scopeRoles: [],
  scopeRolesStatus: "idle",
  scopeRolesError: null,
  mutationStatus: "idle",
  mutationError: null,
};

const toError = (error: unknown): ClientsApiError =>
  (error as ClientsApiError).status !== undefined
    ? (error as ClientsApiError)
    : { status: null, message: (error as Error)?.message ?? "unknown error" };

const failed = (status: null = null, message?: string): ClientsApiError => ({
  status,
  message: message ?? "unknown error",
});

export const fetchClients = createAsyncThunk<
  ListEnvelope<Client>,
  ClientsListParams,
  { rejectValue: ClientsApiError }
>("clients/fetchList", async (params, { rejectWithValue }) => {
  try {
    return await listClients(params);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const fetchClientById = createAsyncThunk<
  Client,
  string,
  { rejectValue: ClientsApiError }
>("clients/fetchOne", async (id, { rejectWithValue }) => {
  try {
    return await getClient(id);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const fetchScopeRoles = createAsyncThunk<
  ScopeRoleMapping[],
  string,
  { rejectValue: ClientsApiError }
>("clients/fetchScopeRoles", async (clientId, { rejectWithValue }) => {
  try {
    return (await listScopeRoles(clientId)).items;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const createClientThunk = createAsyncThunk<
  Client,
  CreateClientInput,
  { rejectValue: ClientsApiError }
>("clients/create", async (input, { rejectWithValue }) => {
  try {
    return await createClient(input);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const updateClientThunk = createAsyncThunk<
  Client,
  { id: string; input: UpdateClientInput },
  { rejectValue: ClientsApiError }
>("clients/update", async ({ id, input }, { rejectWithValue }) => {
  try {
    return await updateClient(id, input);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const deleteClientThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: ClientsApiError }
>("clients/delete", async (id, { rejectWithValue }) => {
  try {
    await deleteClient(id);
    return id;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const addScopeRoleThunk = createAsyncThunk<
  ScopeRoleMapping,
  { clientId: string; input: AddScopeRoleInput },
  { rejectValue: ClientsApiError }
>("clients/addScopeRole", async ({ clientId, input }, { rejectWithValue }) => {
  try {
    return await addScopeRole(clientId, input);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const toggleScopeRoleThunk = createAsyncThunk<
  { scope: string; roleId: string; required: boolean },
  { clientId: string; scope: string; roleId: string; required: boolean },
  { rejectValue: ClientsApiError }
>(
  "clients/toggleScopeRole",
  async ({ clientId, scope, roleId, required }, { rejectWithValue }) => {
    try {
      const updated = await updateScopeRole(clientId, scope, roleId, required);
      return {
        scope: updated.scope,
        roleId: updated.role_id,
        required: updated.required,
      };
    } catch (error) {
      return rejectWithValue(toError(error));
    }
  },
);

export const deleteScopeRoleThunk = createAsyncThunk<
  { scope: string; roleId: string },
  { clientId: string; scope: string; roleId: string },
  { rejectValue: ClientsApiError }
>(
  "clients/deleteScopeRole",
  async ({ clientId, scope, roleId }, { rejectWithValue }) => {
    try {
      await deleteScopeRole(clientId, scope, roleId);
      return { scope, roleId };
    } catch (error) {
      return rejectWithValue(toError(error));
    }
  },
);

const isCurrentList = (state: ClientsState, requestId: string) =>
  state.listRequestId === requestId;

export const clientsSlice = createSlice({
  name: "clients",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state, action) => {
        state.listStatus = "loading";
        state.listError = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        if (!isCurrentList(state, action.meta.requestId)) {
          return;
        }
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.listStatus = "succeeded";
      })
      .addCase(fetchClients.rejected, (state, action) => {
        if (!isCurrentList(state, action.meta.requestId)) {
          return;
        }
        state.listStatus = "failed";
        state.listError = action.payload ?? failed(null, action.error.message);
      })
      .addCase(fetchClientById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.detail = action.payload;
        state.detailStatus = "succeeded";
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError =
          action.payload ?? failed(null, action.error.message);
      })
      .addCase(fetchScopeRoles.pending, (state) => {
        state.scopeRolesStatus = "loading";
        state.scopeRolesError = null;
      })
      .addCase(fetchScopeRoles.fulfilled, (state, action) => {
        state.scopeRoles = action.payload;
        state.scopeRolesStatus = "succeeded";
      })
      .addCase(fetchScopeRoles.rejected, (state, action) => {
        state.scopeRolesStatus = "failed";
        state.scopeRolesError =
          action.payload ?? failed(null, action.error.message);
      })
      .addCase(updateClientThunk.fulfilled, (state, action) => {
        if (state.detail?.id === action.payload.id) {
          state.detail = action.payload;
        }
      })
      .addCase(deleteClientThunk.fulfilled, (state) => {
        state.detail = null;
      })
      .addCase(addScopeRoleThunk.fulfilled, (state, action) => {
        state.scopeRoles.push(action.payload);
      })
      .addCase(toggleScopeRoleThunk.fulfilled, (state, action) => {
        const mapping = state.scopeRoles.find(
          (entry) =>
            entry.scope === action.payload.scope &&
            entry.role_id === action.payload.roleId,
        );
        if (mapping) {
          mapping.required = action.payload.required;
        }
      })
      .addCase(deleteScopeRoleThunk.fulfilled, (state, action) => {
        state.scopeRoles = state.scopeRoles.filter(
          (entry) =>
            !(
              entry.scope === action.payload.scope &&
              entry.role_id === action.payload.roleId
            ),
        );
      });
  },
});

export const clientsReducer = clientsSlice.reducer;
