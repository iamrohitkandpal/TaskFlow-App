import { apiSlice } from './apiSlice';

export const projectApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all projects
    getProjects: builder.query({
      query: () => '/projects',
      providesTags: ['Projects'],
    }),

    // Get single project
    getProject: builder.query({
      query: (projectId) => `/projects/${projectId}`,
      providesTags: (result, error, projectId) => [
        { type: 'Projects', id: projectId }
      ],
    }),

    // Create project
    createProject: builder.mutation({
      query: (data) => ({
        url: '/projects',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Projects'],
    }),

    // Update project
    updateProject: builder.mutation({
      query: ({ projectId, ...data }) => ({
        url: `/projects/${projectId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Projects', id: projectId },
        'Projects'
      ],
    }),

    // Delete project
    deleteProject: builder.mutation({
      query: (projectId) => ({
        url: `/projects/${projectId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Projects'],
    }),

    // Get project tasks (for timeline/gantt)
    getProjectTasks: builder.query({
      query: (projectId) => `/projects/${projectId}/tasks`,
      providesTags: (result, error, projectId) => [
        { type: 'ProjectTasks', id: projectId }
      ],
    }),

    // Update task dependencies
    updateTaskDependencies: builder.mutation({
      query: ({ taskId, dependencies }) => ({
        url: `/tasks/${taskId}/dependencies`,
        method: 'PATCH',
        body: { dependencies },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Tasks', id: taskId },
        'ProjectTasks'
      ],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectTasksQuery,
  useUpdateTaskDependenciesMutation,
} = projectApiSlice;