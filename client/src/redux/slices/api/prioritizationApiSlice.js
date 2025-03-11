import { apiSlice } from '../apiSlice';

const PRIORITIZATION_URL = '/task-prioritization';

export const prioritizationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPrioritizedTasks: builder.query({
      query: ({ userId, projectId } = {}) => ({
        url: `${PRIORITIZATION_URL}/prioritized-tasks`,
        method: 'GET',
        params: { userId, projectId },
        credentials: 'include'
      }),
      keepUnusedDataFor: 30, // Cache for 30 seconds
    }),
    
    getSuggestedAssignees: builder.query({
      query: ({ taskId, skills = [] }) => {
        const skillsParam = skills.join(',');
        return {
          url: `${PRIORITIZATION_URL}/suggested-assignees/${taskId}`,
          method: 'GET',
          params: { skills: skillsParam },
          credentials: 'include'
        };
      },
      keepUnusedDataFor: 30,
    }),
  }),
});

export const {
  useGetPrioritizedTasksQuery,
  useGetSuggestedAssigneesQuery
} = prioritizationApiSlice;