import { api } from './baseApi';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'QA';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  organizationId?: string;
  organizationName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UpdateUserDto {
  name?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'QA';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  organizationId?: string;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalOrganizations: number;
  totalEvents: number;
  totalBudgets: number;
  totalSettlements: number;
  ocrProcessed: number;
  ocrPending: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  ipAddress?: string;
}

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // 전체 사용자 목록 조회
    getAllUsers: builder.query<
      AdminUser[],
      { role?: string; status?: string; search?: string }
    >({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: ['Users'],
    }),

    // 사용자 정보 수정
    updateUser: builder.mutation<AdminUser, { id: string; data: UpdateUserDto }>({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),

    // 사용자 삭제
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),

    // 사용자 상태 변경
    updateUserStatus: builder.mutation<
      AdminUser,
      { id: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }
    >({
      query: ({ id, status }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Users'],
    }),

    // 시스템 통계 조회
    getSystemStats: builder.query<SystemStats, void>({
      query: () => '/admin/stats',
      providesTags: ['Users', 'Organizations', 'Events'],
    }),

    // 활동 로그 조회
    getActivityLogs: builder.query<
      ActivityLog[],
      { limit?: number; userId?: string; action?: string }
    >({
      query: (params) => ({
        url: '/admin/activity-logs',
        params,
      }),
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useGetSystemStatsQuery,
  useGetActivityLogsQuery,
} = adminApi;
