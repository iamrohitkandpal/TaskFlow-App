import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const API_URL = "http://localhost:7007/api";
const API_URL = import.meta.env.VITE_BASE_URL;

// Add this function to retrieve the token from cookies
const getCsrfToken = () => {
  return document.cookie.split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
};

// Add CSRF token handling to API requests
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL + "/api",
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    const csrfToken = getCsrfToken();
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
    
    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: [],
  endpoints: (builder) => ({}),
});
