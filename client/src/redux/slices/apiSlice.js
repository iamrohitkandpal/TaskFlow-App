import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const API_URL = "http://localhost:7007/api";
const API_URL = import.meta.env.VITE_BASE_URL;

const baseQuery = fetchBaseQuery({ baseUrl: API_URL + "/api" });

export const apiSlice = createApi({
  baseQuery,
  tagTypes: [],
  endpoints: (builder) => ({}),
});
