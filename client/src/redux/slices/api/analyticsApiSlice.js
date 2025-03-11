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
      keepUnusedDataFor: 60, // Cache for 60 seconds
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
    
    getProductivityData: builder.query({
      query: (days = 7) => ({
        url: `${ANALYTICS_URL}/productivity?days=${days}`,
        method: 'GET',
        credentials: 'include'
      }),
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetAllAnalyticsQuery,
  useGetCompletionTimeQuery,
  useGetWorkloadDistributionQuery,
  useGetStatusDistributionQuery,
  useGetBurndownDataQuery,
  useGetProductivityDataQuery
} = analyticsApiSlice;