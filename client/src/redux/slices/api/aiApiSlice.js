import { apiSlice } from '../apiSlice';

export const aiApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    summarizeText: builder.mutation({
      query: (data) => ({
        url: '/ai/summarize',
        method: 'POST',
        body: data
      })
    }),
    estimateTaskEffort: builder.query({
      query: (taskId) => ({
        url: `/ai/estimate-effort/${taskId}`,
        method: 'GET'
      })
    }),
    estimateEffortForNewTask: builder.mutation({
      query: (taskData) => ({
        url: '/ai/estimate-effort',
        method: 'POST',
        body: taskData
      })
    })
  })
});

export const { 
  useSummarizeTextMutation, 
  useEstimateTaskEffortQuery,
  useEstimateEffortForNewTaskMutation
} = aiApiSlice;