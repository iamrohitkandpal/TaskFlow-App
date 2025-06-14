import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../../config/constants';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.token;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

// Enhanced error handling
const baseQueryWithRetry = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Add retry logic for network errors
  if (result.error?.status === 'FETCH_ERROR') {
    // Wait 2 seconds before retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Retry the request
    result = await baseQuery(args, api, extraOptions);
    
    // If still fails, handle gracefully
    if (result.error) {
      console.warn('Request failed after retry:', args);
      return {
        error: { 
          status: result.error.status,
          data: { message: 'Network error. Please check your connection.' }
        }
      };
    }
  }

  // Handle 401 errors
  if (result.error?.status === 401 && !args.url.includes('/refresh-token')) {
    try {
      const refreshResult = await baseQuery(
        '/users/refresh-token',
        api,
        extraOptions
      );
      
      if (refreshResult.data) {
        // Retry original request with new token
        api.dispatch(setCredentials({ token: refreshResult.data.token }));
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Logout if refresh fails
        api.dispatch(logout());
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }
  
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithRetry,
  tagTypes: ['Tasks', 'Users', 'Projects', 'Reports', 'Activities', 'Notices'],
  endpoints: (builder) => ({}),
});