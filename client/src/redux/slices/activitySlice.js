import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for fetching activities
export const fetchActivities = createAsyncThunk(
  'activities/fetchActivities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/activities/recent');
      return response.data.activities;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const activitySlice = createSlice({
  name: 'activities',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    addActivity: (state, action) => {
      // Add new activity to the beginning of the array
      state.items.unshift(action.payload);
      // Keep only the latest 100 activities in memory
      if (state.items.length > 100) {
        state.items.pop();
      }
    },
    clearActivities: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch activities';
      });
  },
});

export const { addActivity, clearActivities } = activitySlice.actions;
export default activitySlice.reducer;