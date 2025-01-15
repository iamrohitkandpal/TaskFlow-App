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
      const user = action.payload.data.user;
      state.user = user;
      localStorage.setItem("userInfo", JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("userInfo");
    },
    setIsSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
  },
});

export const { setCredentials, logout, setIsSidebarOpen } = authSlice.actions;

export default authSlice.reducer;