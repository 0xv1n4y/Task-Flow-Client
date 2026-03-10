import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import { taskAPI } from '../lib/api.js';

// ── Async thunks ─────────────────────────────────────────────────────────────

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (getToken, { rejectWithValue }) => {
    try {
      const { data } = await taskAPI.getAll(getToken);
      return data.map((t) => ({ ...t, id: t._id }));
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addTask = createAsyncThunk(
  'tasks/add',
  async ({ taskData, getToken }, { rejectWithValue }) => {
    try {
      const { data } = await taskAPI.create(taskData, getToken);
      return { ...data, id: data._id };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ id, updates, getToken }, { rejectWithValue }) => {
    try {
      const { data } = await taskAPI.update(id, updates, getToken);
      return { ...data, id: data._id };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async ({ id, getToken }, { rejectWithValue }) => {
    try {
      await taskAPI.remove(id, getToken);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleTask = createAsyncThunk(
  'tasks/toggle',
  async ({ id, getToken }, { rejectWithValue }) => {
    try {
      const { data } = await taskAPI.toggle(id, getToken);
      return { ...data, id: data._id };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    loading: false,
    error: null,
    // tracks temp IDs for optimistic updates: requestId → tempId
    optimisticIds: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    // ── fetchTasks ────────────────────────────────────────────────────────────
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── addTask (optimistic) ──────────────────────────────────────────────────
    builder
      .addCase(addTask.pending, (state, action) => {
        const tempId = `temp-${action.meta.requestId}`;
        state.optimisticIds[action.meta.requestId] = tempId;
        state.items.unshift({
          ...action.meta.arg.taskData,
          id: tempId,
          createdAt: format(new Date(), 'yyyy-MM-dd'),
          completedAt: null,
          completed: false,
          dueDate: action.meta.arg.taskData.dueDate || null,
          dueTime: action.meta.arg.taskData.dueTime || null,
        });
      })
      .addCase(addTask.fulfilled, (state, action) => {
        const tempId = state.optimisticIds[action.meta.requestId];
        const idx = state.items.findIndex((t) => t.id === tempId);
        if (idx !== -1) state.items[idx] = action.payload;
        delete state.optimisticIds[action.meta.requestId];
      })
      .addCase(addTask.rejected, (state, action) => {
        const tempId = state.optimisticIds[action.meta.requestId];
        state.items = state.items.filter((t) => t.id !== tempId);
        delete state.optimisticIds[action.meta.requestId];
        state.error = action.payload;
      });

    // ── updateTask (optimistic) ───────────────────────────────────────────────
    builder
      .addCase(updateTask.pending, (state, action) => {
        const { id, updates } = action.meta.arg;
        const idx = state.items.findIndex((t) => t.id === id);
        if (idx !== -1) {
          // stash original for rollback
          state.optimisticIds[action.meta.requestId] = JSON.stringify(state.items[idx]);
          state.items[idx] = { ...state.items[idx], ...updates };
        }
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        delete state.optimisticIds[action.meta.requestId];
      })
      .addCase(updateTask.rejected, (state, action) => {
        const original = state.optimisticIds[action.meta.requestId];
        if (original) {
          const parsed = JSON.parse(original);
          const idx = state.items.findIndex((t) => t.id === parsed.id);
          if (idx !== -1) state.items[idx] = parsed;
        }
        delete state.optimisticIds[action.meta.requestId];
        state.error = action.payload;
      });

    // ── deleteTask (optimistic) ───────────────────────────────────────────────
    builder
      .addCase(deleteTask.pending, (state, action) => {
        const { id } = action.meta.arg;
        const task = state.items.find((t) => t.id === id);
        if (task) {
          state.optimisticIds[action.meta.requestId] = JSON.stringify(task);
          state.items = state.items.filter((t) => t.id !== id);
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        delete state.optimisticIds[action.meta.requestId];
      })
      .addCase(deleteTask.rejected, (state, action) => {
        const original = state.optimisticIds[action.meta.requestId];
        if (original) state.items.unshift(JSON.parse(original));
        delete state.optimisticIds[action.meta.requestId];
        state.error = action.payload;
      });

    // ── toggleTask (optimistic) ───────────────────────────────────────────────
    builder
      .addCase(toggleTask.pending, (state, action) => {
        const { id } = action.meta.arg;
        const idx = state.items.findIndex((t) => t.id === id);
        if (idx !== -1) {
          state.optimisticIds[action.meta.requestId] = JSON.stringify(state.items[idx]);
          const t = state.items[idx];
          state.items[idx] = {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? format(new Date(), 'yyyy-MM-dd') : null,
          };
        }
      })
      .addCase(toggleTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        delete state.optimisticIds[action.meta.requestId];
      })
      .addCase(toggleTask.rejected, (state, action) => {
        const original = state.optimisticIds[action.meta.requestId];
        if (original) {
          const parsed = JSON.parse(original);
          const idx = state.items.findIndex((t) => t.id === parsed.id);
          if (idx !== -1) state.items[idx] = parsed;
        }
        delete state.optimisticIds[action.meta.requestId];
        state.error = action.payload;
      });
  },
});

export default tasksSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectTasks = (state) => state.tasks.items;
export const selectTasksLoading = (state) => state.tasks.loading;
export const selectTasksError = (state) => state.tasks.error;
