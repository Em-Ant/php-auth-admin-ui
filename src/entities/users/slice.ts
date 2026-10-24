import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { DEFAULT_PAGE_SIZE } from "@/entities/realms";
import type { ListEnvelope, Role, User } from "@/shared/api/contract";
import {
  assignUserRole,
  type CreateUserInput,
  createUser,
  deleteUser,
  getUserById,
  listUserRoles,
  listUsers,
  removeUserRole,
  type UpdateUserInput,
  type UsersApiError,
  type UsersListParams,
  updateUser,
} from "./api";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface UsersState {
  items: User[];
  total: number;
  limit: number;
  offset: number;
  listStatus: RequestStatus;
  listError: UsersApiError | null;
  listRequestId: string | null;
  detail: User | null;
  detailStatus: RequestStatus;
  detailError: UsersApiError | null;
  userRoles: Role[];
  userRolesStatus: RequestStatus;
  userRolesError: UsersApiError | null;
}

const initialState: UsersState = {
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
  userRoles: [],
  userRolesStatus: "idle",
  userRolesError: null,
};

const toError = (error: unknown): UsersApiError =>
  (error as UsersApiError).status !== undefined
    ? (error as UsersApiError)
    : { status: null, message: (error as Error)?.message ?? "unknown error" };

const failed = (message?: string): UsersApiError => ({
  status: null,
  message: message ?? "unknown error",
});

export const fetchUsers = createAsyncThunk<
  ListEnvelope<User>,
  UsersListParams,
  { rejectValue: UsersApiError }
>("users/fetchList", async (params, { rejectWithValue }) => {
  try {
    return await listUsers(params);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const fetchUserById = createAsyncThunk<
  User,
  string,
  { rejectValue: UsersApiError }
>("users/fetchOne", async (id, { rejectWithValue }) => {
  try {
    return await getUserById(id);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const fetchUserRoles = createAsyncThunk<
  Role[],
  string,
  { rejectValue: UsersApiError }
>("users/fetchRoles", async (userId, { rejectWithValue }) => {
  try {
    return (await listUserRoles(userId)).items;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const createUserThunk = createAsyncThunk<
  User,
  CreateUserInput,
  { rejectValue: UsersApiError }
>("users/create", async (input, { rejectWithValue }) => {
  try {
    return await createUser(input);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const updateUserThunk = createAsyncThunk<
  User,
  { id: string; input: UpdateUserInput },
  { rejectValue: UsersApiError }
>("users/update", async ({ id, input }, { rejectWithValue }) => {
  try {
    return await updateUser(id, input);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const deleteUserThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: UsersApiError }
>("users/delete", async (id, { rejectWithValue }) => {
  try {
    await deleteUser(id);
    return id;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const assignUserRoleThunk = createAsyncThunk<
  Role,
  { userId: string; roleId: string },
  { rejectValue: UsersApiError }
>("users/assignRole", async ({ userId, roleId }, { rejectWithValue }) => {
  try {
    return await assignUserRole(userId, roleId);
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const removeUserRoleThunk = createAsyncThunk<
  string,
  { userId: string; roleId: string },
  { rejectValue: UsersApiError }
>("users/removeRole", async ({ userId, roleId }, { rejectWithValue }) => {
  try {
    await removeUserRole(userId, roleId);
    return roleId;
  } catch (error) {
    return rejectWithValue(toError(error));
  }
});

export const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state, action) => {
        state.listStatus = "loading";
        state.listError = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.listStatus = "succeeded";
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) {
          return;
        }
        state.listStatus = "failed";
        state.listError = action.payload ?? failed(action.error.message);
      })
      .addCase(fetchUserById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.detail = action.payload;
        state.detailStatus = "succeeded";
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload ?? failed(action.error.message);
      })
      .addCase(fetchUserRoles.pending, (state) => {
        state.userRolesStatus = "loading";
        state.userRolesError = null;
      })
      .addCase(fetchUserRoles.fulfilled, (state, action) => {
        state.userRoles = action.payload;
        state.userRolesStatus = "succeeded";
      })
      .addCase(fetchUserRoles.rejected, (state, action) => {
        state.userRolesStatus = "failed";
        state.userRolesError = action.payload ?? failed(action.error.message);
      })
      .addCase(updateUserThunk.fulfilled, (state, action) => {
        if (state.detail?.id === action.payload.id) {
          state.detail = action.payload;
        }
      })
      .addCase(deleteUserThunk.fulfilled, (state) => {
        state.detail = null;
      })
      .addCase(assignUserRoleThunk.fulfilled, (state, action) => {
        if (!state.userRoles.some((role) => role.id === action.payload.id)) {
          state.userRoles.push(action.payload);
        }
      })
      .addCase(removeUserRoleThunk.fulfilled, (state, action) => {
        state.userRoles = state.userRoles.filter(
          (role) => role.id !== action.payload,
        );
      });
  },
});

export const usersReducer = usersSlice.reducer;
