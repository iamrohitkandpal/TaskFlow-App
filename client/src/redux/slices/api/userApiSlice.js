import { apiSlice } from "../apiSlice";

const USER_URL = "/users";

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updateUser: builder.mutation({
      query: (data) => ({
        url: `${USER_URL}/profile`,
        method: "PUT",
        body: data,
        credentials: "include",
      }),
    }),

    deleteUser: builder.mutation({
      query: (id) => ({
        url: `${USER_URL}/${id}`,
        method: "DELETE",
        credentials: "include",
      }),
    }),

    userActions: builder.mutation({
      query: (data) => ({
        url: `${USER_URL}/${data.id}`,
        method: "PUT",
        body: data,
        credentials: "include",
      }),
    }),

    getTeamList: builder.query({
      query: () => ({
        url: `${USER_URL}/get-team`,
        method: "GET",
        credentials: "include",
      }),
    }),

    getNotifications: builder.query({
      query: () => ({
        url: `${USER_URL}/notifications`,
        method: "GET",
        credentials: "include",
      }),
    }),

    markNotificationAsRead: builder.mutation({
      query: (data) => {
        if (!data?.type || (!data?.id && data?.type !== "all")) {
          throw new Error("Invalid data for marking notification as read.");
        }
        return {
          url: `${USER_URL}/read-noti?isReadType=${data.type}&id=${data.id || ""}`,
          method: "PUT",
          body: data,
          credentials: "include",
        };
      },
    }),
    

    changePassword: builder.mutation({
      query: (data) => ({
        url: `${USER_URL}/change-password`,
        method: "PUT",
        body: data,
        credentials: "include",
      }),
    }),
  }),
});

export const {
  useUpdateUserMutation,
  useGetTeamListQuery,
  useDeleteUserMutation,
  useUserActionsMutation,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useChangePasswordMutation,
} = userApiSlice;
