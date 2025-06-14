import { apiSlice } from './apiSlice';

const AUTH_URL = '/users';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: `${AUTH_URL}/login`,
        method: 'POST',
        body: credentials,
        credentials: 'include'
      })
    }),
    
    register: builder.mutation({
      query: (userData) => ({
        url: `${AUTH_URL}/register`,
        method: 'POST',
        body: userData,
        credentials: 'include'
      })
    }),

    logout: builder.mutation({
      query: () => ({
        url: `${AUTH_URL}/logout`,
        method: 'POST',
        credentials: 'include'
      })
    })
  })
});

export const { 
  useLoginMutation, 
  useLogoutMutation,
  useRegisterMutation 
} = authApiSlice;
