import Cookies from "js-cookie";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
  user: localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null,
  token: localStorage.getItem("token") || null,
  isSidebarOpen: false,
};

// Enhance the logout action
export const logout = createAsyncThunk(
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

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      
      // Also store in localStorage for persistence
      localStorage.setItem("token", token);
      localStorage.setItem("userInfo", JSON.stringify(user));
    },
    setIsSidebarOpen: (state, action) => {
      state.isSidebarOpen = action?.payload;
    },
  },
});

export const { setCredentials, setIsSidebarOpen } = authSlice.actions;

export const protectedRoute = (dispatch) => {
  const token = Cookies.get("token");
  
  // Only log out if there's no token but user data exists in localStorage
  if (!token && localStorage.getItem("userInfo")) {
    dispatch(logout());
    return false;
  }

  return !!token;
};

export default authSlice.reducer;
