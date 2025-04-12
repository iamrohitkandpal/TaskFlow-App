import Cookies from "js-cookie";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null,
  token: localStorage.getItem("token") || null,
  isSidebarOpen: false,
};

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
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
    },
    setIsSidebarOpen: (state, action) => {
      state.isSidebarOpen = action?.payload;
    },
  },
});

export const { setCredentials, logout, setIsSidebarOpen } = authSlice.actions;

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
