import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/constants';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.token;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
  credentials: 'include', // Critical for sending cookies with requests
});

// Enhanced error logging for debugging
const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
  try {
    const result = await baseQuery(args, api, extraOptions);
    
    if (result.error) {
      console.log('API error:', {
        url: typeof args === 'string' ? args : args.url,
        status: result.error.status,
        data: result.error.data
      });
    }
    
    return result;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: { status: 500, data: { message: error.message } }
    };
  }
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ['Tasks', 'Users', 'Projects', 'TeamList', 'Notifications'],
  endpoints: (builder) => ({})
});
