import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/constants';

export const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Get token from state if available, otherwise from localStorage
    const token = getState().auth.token || localStorage.getItem('token');
    
    if (token) {
      // Ensure token is properly formatted with Bearer prefix
      headers.set('authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
    }
    
    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['Tasks', 'Users', 'Projects', 'Reports', 'Activities', 'Notices'],
  endpoints: (builder) => ({}),
});
