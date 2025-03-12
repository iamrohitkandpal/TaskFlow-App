import { apiSlice } from '../apiSlice';

export const integrationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    connectToGitHub: builder.mutation({
      query: (data) => ({
        url: '/integrations/connect/github',
        method: 'POST',
        body: data
      })
    }),
    
    connectToGitLab: builder.mutation({
      query: (data) => ({
        url: '/integrations/connect/gitlab',
        method: 'POST',
        body: data
      })
    }),
    
    getUserIntegrations: builder.query({
      query: () => ({
        url: '/integrations/user',
        method: 'GET'
      }),
      providesTags: ['Integrations']
    }),
    
    refreshRepositories: builder.mutation({
      query: (integrationId) => ({
        url: `/integrations/refresh/${integrationId}`,
        method: 'GET'
      }),
      invalidatesTags: ['Integrations']
    }),
    
    linkGitReference: builder.mutation({
      query: ({ taskId, reference }) => ({
        url: `/integrations/link/${taskId}`,
        method: 'POST',
        body: reference
      }),
      invalidatesTags: ['Task']
    })
  })
});

export const {
  useConnectToGitHubMutation,
  useConnectToGitLabMutation,
  useGetUserIntegrationsQuery,
  useRefreshRepositoriesMutation,
  useLinkGitReferenceMutation
} = integrationApiSlice;