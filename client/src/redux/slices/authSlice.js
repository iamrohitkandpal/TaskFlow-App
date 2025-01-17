// import { createSlice } from "@reduxjs/toolkit";

// const initialState = {
//   user: localStorage.getItem("userInfo")
//     ? JSON.parse(localStorage.getItem("userInfo"))
//     : null,
//   isSidebarOpen: false,
// };

// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     setCredentials: (state, action) => {
//       const user = action?.payload?.data?.user;
//       state.user = user;
//       localStorage.setItem("userInfo", JSON.stringify(user));
//     },
//     logout: (state) => {
//       state.user = null;
//       localStorage.removeItem("userInfo");
//     },
//     setIsSidebarOpen: (state, action) => {
//       state.isSidebarOpen = action?.payload;
//     },
//   },
// });

// export const { setCredentials, logout, setIsSidebarOpen } = authSlice.actions;

// export default authSlice.reducer;

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
      const user = action?.payload?.data?.user;
      state.user = user;
      localStorage.setItem("userInfo", JSON.stringify(user));
      // const token = action?.payload?.data?.token; 
      // Cookies.set("token", token, { expires: 7 });
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("userInfo");
    },
    setIsSidebarOpen: (state, action) => {
      state.isSidebarOpen = action?.payload;
    },
  },
});

export const { setCredentials, logout, setIsSidebarOpen } = authSlice.actions;

export const checkAuth = (dispatch) => {
  const token = Cookies.get("token");
  console.log(token)
  if (!token) {
    dispatch(logout());
    return false;
  }

  return true;
};

export default authSlice.reducer;
