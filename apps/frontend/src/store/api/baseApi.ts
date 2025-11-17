import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout } from '@/store/slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as any;
    const token = state.auth?.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  // 401 Unauthorized 응답 시 자동 로그아웃
  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
    // 로그인 페이지로 리다이렉트는 ProtectedRoute에서 처리
  }

  // Backend의 {success: true, data: {...}} 형태에서 data만 추출
  if (result.data && typeof result.data === 'object' && 'data' in result.data) {
    return { ...result, data: (result.data as any).data };
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Auth', 'Users', 'Organizations', 'Events', 'Budgets', 'Settlements', 'OCR', 'Blog', 'Notifications'],
  endpoints: () => ({}),
});
