import Cookies from "js-cookie";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AUTH_TOKEN_NAME } from '../../config/constants';
import { apiSlice } from './apiSlice';

const initialState = {
  user: localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null,
  token: localStorage.getItem(AUTH_TOKEN_NAME),
  isSidebarOpen: false,
};

// Rename this to logoutThunk to avoid naming conflict
export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      // Clear all local storage
      localStorage.removeItem(AUTH_TOKEN_NAME);
      localStorage.removeItem("user");
      
      // Clear any cached app data
      indexedDB.deleteDatabase("taskflow_offline_db");
      
      // Disconnect socket
      if (window.socket) {
        window.socket.disconnect();
      }
      
      // Reset all Redux state
      dispatch(apiSlice.util.resetApiState());
      
      return { success: true };
    } catch (error) {
      console.error("Error during logout:", error);
      return { success: false, error: error.message };
    }
  }
);

export const setCredentials = createAsyncThunk(
  'auth/setCredentials',
  async ({ user, token }, { dispatch }) => {
    localStorage.setItem(AUTH_TOKEN_NAME, token);
    localStorage.setItem('userInfo', JSON.stringify(user));
    return { user, token };
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("userInfo");
      localStorage.removeItem(AUTH_TOKEN_NAME);
      // Clear all API cache
      apiSlice.util.resetApiState();
    },
    setIsSidebarOpen: (state, action) => {
      state.isSidebarOpen = action?.payload;
    },
  },
});

export const { logout, setIsSidebarOpen } = authSlice.actions;

export default authSlice.reducer;
