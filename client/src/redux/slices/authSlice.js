import Cookies from "js-cookie";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null,
  isSidebarOpen: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      // Only set credentials if the response is successful and contains user data
      if (action?.payload?.data?.status && action?.payload?.data?.user) {
        const user = action?.payload?.data?.user;
        state.user = user;
        localStorage.setItem("userInfo", JSON.stringify(user));
      }
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("userInfo");
      // Don't modify any other data, just clear auth state
    },
    setIsSidebarOpen: (state, action) => {
      state.isSidebarOpen = action?.payload;
    },
  },
});

export const { setCredentials, logout, setIsSidebarOpen } = authSlice.actions;

export const checkAuth = (dispatch) => {
  const token = Cookies.get("token");
  
  // Only log out if there's no token but user data exists in localStorage
  if (!token && localStorage.getItem("userInfo")) {
    dispatch(logout());
    return false;
  }

  return !!token;
};

export default authSlice.reducer;
