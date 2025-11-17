import { api } from './baseApi';
import type { User } from '@/types';
import type { ProfileUpdateData, PasswordChangeData } from '@/schemas/profileSchema';

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation<User, ProfileUpdateData>({
      query: (data) => ({
        url: '/users/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Auth'],
    }),
    changePassword: builder.mutation<void, PasswordChangeData>({
      query: (data) => ({
        url: '/users/password',
        method: 'PATCH',
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      }),
    }),
  }),
});

export const { useUpdateProfileMutation, useChangePasswordMutation } = userApi;
