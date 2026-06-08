import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async ({ page = 1, limit = 10, search = '' } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/users', { params: { page, limit, search } });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/create',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/users', userData);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/users/${id}`, updates);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete user');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    pagination: { total: 0, page: 1, limit: 10, pages: 1 },
    isLoading: false,
    error: null,
  },
  reducers: {
    clearUsersError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.items = payload.users;
        state.pagination = payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(createUser.fulfilled, (state, { payload }) => {
        state.items.unshift(payload);
        state.pagination.total += 1;
      })
      .addCase(createUser.rejected, (state, { payload }) => {
        state.error = payload;
      })
      .addCase(updateUser.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex((u) => u._id === payload._id);
        if (idx !== -1) state.items[idx] = payload;
      })
      .addCase(updateUser.rejected, (state, { payload }) => {
        state.error = payload;
      })
      .addCase(deleteUser.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((u) => u._id !== payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteUser.rejected, (state, { payload }) => {
        state.error = payload;
      });
  },
});

export const { clearUsersError } = usersSlice.actions;

export const selectUsers = (state) => state.users.items;
export const selectUsersPagination = (state) => state.users.pagination;
export const selectUsersLoading = (state) => state.users.isLoading;
export const selectUsersError = (state) => state.users.error;

export default usersSlice.reducer;
