import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchPermissions = createAsyncThunk(
  'permissions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/permissions');
      return data.permissions;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch permissions');
    }
  }
);

export const createPermission = createAsyncThunk(
  'permissions/create',
  async (permData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/permissions', permData);
      return data.permission;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create permission');
    }
  }
);

export const updatePermission = createAsyncThunk(
  'permissions/update',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/permissions/${id}`, updates);
      return data.permission;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update permission');
    }
  }
);

export const deletePermission = createAsyncThunk(
  'permissions/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/permissions/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete permission');
    }
  }
);

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearPermissionsError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchPermissions.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.items = payload;
      })
      .addCase(fetchPermissions.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(createPermission.fulfilled, (state, { payload }) => {
        state.items.push(payload);
      })
      .addCase(createPermission.rejected, (state, { payload }) => {
        state.error = payload;
      })
      .addCase(updatePermission.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex((p) => p._id === payload._id);
        if (idx !== -1) state.items[idx] = payload;
      })
      .addCase(updatePermission.rejected, (state, { payload }) => {
        state.error = payload;
      })
      .addCase(deletePermission.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((p) => p._id !== payload);
      })
      .addCase(deletePermission.rejected, (state, { payload }) => {
        state.error = payload;
      });
  },
});

export const { clearPermissionsError } = permissionsSlice.actions;

export const selectPermissionsList = (state) => state.permissions.items;
export const selectPermissionsLoading = (state) => state.permissions.isLoading;
export const selectPermissionsError = (state) => state.permissions.error;

export default permissionsSlice.reducer;
