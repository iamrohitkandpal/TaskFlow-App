import { apiSlice } from '../apiSlice';

const ANALYTICS_URL = '/analytics';

export const analyticsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllAnalytics: builder.query({
      query: () => ({
        url: ANALYTICS_URL,
        method: 'GET',
        credentials: 'include'
      }),
      keepUnusedDataFor: 60,
    }),
    
    getDashboardStats: builder.query({
      query: () => ({
        url: `${ANALYTICS_URL}/dashboard`,
        method: 'GET',
        credentials: 'include'
      }),
      keepUnusedDataFor: 60,
      overrideExisting: true
    }),
    
    getProductivityData: builder.query({
      query: (days = 7) => ({
        url: `${ANALYTICS_URL}/productivity`,
        method: 'GET',
        credentials: 'include'
      }),
      keepUnusedDataFor: 60,
      overrideExisting: true
    }),

    getCompletionTime: builder.query({
      query: () => ({
        url: `${ANALYTICS_URL}/completion-time`,
        method: 'GET',
        credentials: 'include'
      }),
      keepUnusedDataFor: 60,
    }),
    
    getWorkloadDistribution: builder.query({
      query: () => ({
        url: `${ANALYTICS_URL}/workload`,
        method: 'GET',
        credentials: 'include'
      }),
      keepUnusedDataFor: 60,
    }),
    
    getStatusDistribution: builder.query({
      query: () => ({
        url: `${ANALYTICS_URL}/status-distribution`,
        method: 'GET',
        credentials: 'include'
      }),
      keepUnusedDataFor: 60,
    }),
    
    getBurndownData: builder.query({
      query: (days = 14) => ({
        url: `${ANALYTICS_URL}/burndown?days=${days}`,
        method: 'GET',
        credentials: 'include'
      }),
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetAllAnalyticsQuery,
  useGetDashboardStatsQuery,
  useGetProductivityDataQuery,
  useGetCompletionTimeQuery,
  useGetWorkloadDistributionQuery,
  useGetStatusDistributionQuery,
  useGetBurndownDataQuery
} = analyticsApiSlice;