import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../../config/constants';

export const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
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
  tagTypes: ['Tasks', 'Users', 'Projects', 'Reports', 'Activities', 'Notices'],
  endpoints: (builder) => ({}),
});