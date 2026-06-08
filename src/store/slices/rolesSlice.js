import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchRoles = createAsyncThunk(
  'roles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/roles');
      return data.roles;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch roles');
    }
  }
);

export const createRole = createAsyncThunk(
  'roles/create',
  async (roleData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/roles', roleData);
      return data.role;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create role');
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/update',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/roles/${id}`, updates);
      return data.role;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update role');
    }
  }
);

export const deleteRole = createAsyncThunk(
  'roles/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/roles/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete role');
    }
  }
);

const rolesSlice = createSlice({
  name: 'roles',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearRolesError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchRoles.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.items = payload;
      })
      .addCase(fetchRoles.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(createRole.fulfilled, (state, { payload }) => {
        state.items.push(payload);
      })
      .addCase(createRole.rejected, (state, { payload }) => {
        state.error = payload;
      })
      .addCase(updateRole.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex((r) => r._id === payload._id);
        if (idx !== -1) state.items[idx] = payload;
      })
      .addCase(updateRole.rejected, (state, { payload }) => {
        state.error = payload;
      })
      .addCase(deleteRole.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((r) => r._id !== payload);
      })
      .addCase(deleteRole.rejected, (state, { payload }) => {
        state.error = payload;
      });
  },
});

export const { clearRolesError } = rolesSlice.actions;

export const selectRolesList = (state) => state.roles.items;
export const selectRolesLoading = (state) => state.roles.isLoading;
export const selectRolesError = (state) => state.roles.error;

export default rolesSlice.reducer;
