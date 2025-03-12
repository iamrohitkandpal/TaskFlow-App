import { apiSlice } from '../apiSlice';

export const calendarApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    connectCalDAV: builder.mutation({
      query: (data) => ({
        url: '/calendar/caldav/connect',
        method: 'POST',
        body: data
      })
    }),
    
    syncTaskToCalendar: builder.mutation({
      query: (data) => ({
        url: '/calendar/task/sync',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Task']
    }),
    
    getUserCalendars: builder.query({
      query: () => ({
        url: '/calendar/user',
        method: 'GET'
      })
    })
  })
});

export const {
  useConnectCalDAVMutation,
  useSyncTaskToCalendarMutation,
  useGetUserCalendarsQuery
} = calendarApiSlice;