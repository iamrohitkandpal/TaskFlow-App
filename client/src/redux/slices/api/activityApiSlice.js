import { apiSlice } from '../apiSlice';

export const activityApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTaskActivities: builder.query({
      query: (taskId) => `/activities/task/${taskId}`,
      providesTags: ['Activities']
    }),
    getUserActivities: builder.query({
      query: (userId) => `/activities/user/${userId}`,
      providesTags: ['Activities']
    }),
    getRecentActivities: builder.query({
      query: () => `/activities/recent`,
      providesTags: ['Activities']
    })
  })
});

export const {
  useGetTaskActivitiesQuery,
  useGetUserActivitiesQuery,
  useGetRecentActivitiesQuery
} = activityApiSlice;