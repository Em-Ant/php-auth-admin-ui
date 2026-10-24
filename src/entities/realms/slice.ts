import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { ListEnvelope, Realm } from "@/shared/api/contract";
import {
  type CreateRealmInput,
  createKeys,
  createRealm,
  deleteRealm,
  getRealm,
  listRealms,
  type RealmsApiError,
  type RealmsListParams,
  type UpdateRealmInput,
  updateRealm,
} from "./api";

export const DEFAULT_PAGE_SIZE = 20;

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface RealmsState {
  items: Realm[];
  total: number;
  /** Applied values echoed back by the API, not what was requested. */
  limit: number;
  offset: number;
  listStatus: RequestStatus;
  listError: RealmsApiError | null;
  listRequestId: string | null;
  detail: Realm | null;
  detailStatus: RequestStatus;
  detailError: RealmsApiError | null;
  mutationStatus: "idle" | "saving" | "succeeded" | "failed";
  mutationError: RealmsApiError | null;
}

const initialState: RealmsState = {
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
  mutationStatus: "idle",
  mutationError: null,
};

const toError = (error: unknown): RealmsApiError =>
  (error as { status?: number | null; message?: string }).status !== undefined
    ? (error as RealmsApiError)
    : { status: null, message: (error as Error)?.message ?? "unknown error" };

export const fetchRealms = createAsyncThunk<
  ListEnvelope<Realm>,
  RealmsListParams,
  { rejectValue: RealmsApiError }
>("realms/fetchList", async (params, { rejectWithValue }) => {
  try {
    return await listRealms(params);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const fetchRealmById = createAsyncThunk<
  Realm,
  string,
  { rejectValue: RealmsApiError }
>("realms/fetchOne", async (id, { rejectWithValue }) => {
  try {
    return await getRealm(id);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const createRealmThunk = createAsyncThunk<
  Realm,
  CreateRealmInput,
  { rejectValue: RealmsApiError }
>("realms/create", async (input, { rejectWithValue }) => {
  try {
    return await createRealm(input);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const updateRealmThunk = createAsyncThunk<
  Realm,
  { id: string; input: UpdateRealmInput },
  { rejectValue: RealmsApiError }
>("realms/update", async ({ id, input }, { rejectWithValue }) => {
  try {
    return await updateRealm(id, input);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const deleteRealmThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: RealmsApiError }
>("realms/delete", async (id, { rejectWithValue }) => {
  try {
    await deleteRealm(id);
    return id;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const createKeysThunk = createAsyncThunk<
  string,
  void,
  { rejectValue: RealmsApiError }
>("realms/createKeys", async (_, { rejectWithValue }) => {
  try {
    return (await createKeys()).kid;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

const isCurrentList = (state: RealmsState, requestId: string) =>
  state.listRequestId === requestId;

export const realmsSlice = createSlice({
  name: "realms",
  initialState,
  reducers: {
    resetMutation: (state) => {
      state.mutationStatus = "idle";
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRealms.pending, (state, action) => {
        state.listStatus = "loading";
        state.listError = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchRealms.fulfilled, (state, action) => {
        if (!isCurrentList(state, action.meta.requestId)) {
          return;
        }
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.listStatus = "succeeded";
      })
      .addCase(fetchRealms.rejected, (state, action) => {
        if (!isCurrentList(state, action.meta.requestId)) {
          return;
        }
        state.listStatus = "failed";
        state.listError = action.payload ?? {
          status: null,
          message: action.error.message ?? "unknown error",
        };
      })
      .addCase(fetchRealmById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(
        fetchRealmById.fulfilled,
        (state, action: PayloadAction<Realm>) => {
          state.detail = action.payload;
          state.detailStatus = "succeeded";
        },
      )
      .addCase(fetchRealmById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload ?? {
          status: null,
          message: action.error.message ?? "unknown error",
        };
      })
      .addCase(createRealmThunk.pending, (state) => {
        state.mutationStatus = "saving";
        state.mutationError = null;
      })
      .addCase(createRealmThunk.fulfilled, (state) => {
        state.mutationStatus = "succeeded";
      })
      .addCase(createRealmThunk.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload ?? {
          status: null,
          message: action.error.message ?? "unknown error",
        };
      })
      .addCase(updateRealmThunk.pending, (state) => {
        state.mutationStatus = "saving";
        state.mutationError = null;
      })
      .addCase(updateRealmThunk.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        if (state.detail?.id === action.payload.id) {
          state.detail = action.payload;
        }
      })
      .addCase(updateRealmThunk.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload ?? {
          status: null,
          message: action.error.message ?? "unknown error",
        };
      })
      .addCase(deleteRealmThunk.pending, (state) => {
        state.mutationStatus = "saving";
        state.mutationError = null;
      })
      .addCase(deleteRealmThunk.fulfilled, (state) => {
        state.mutationStatus = "succeeded";
        state.detail = null;
      })
      .addCase(deleteRealmThunk.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload ?? {
          status: null,
          message: action.error.message ?? "unknown error",
        };
      });
  },
});

export const { resetMutation } = realmsSlice.actions;
export const realmsReducer = realmsSlice.reducer;
