import { store } from '@/store';
import { setCredentials, logout } from '@/store/slices/authSlice';

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14분 (15분 만료 전에 갱신)
let refreshTimer: NodeJS.Timeout | null = null;

/**
 * Access Token 자동 갱신 타이머 시작
 */
export const startTokenRefresh = () => {
  // 기존 타이머가 있으면 취소
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  // 14분마다 토큰 갱신 시도
  refreshTimer = setInterval(async () => {
    try {
      const state = store.getState();
      const { refreshToken } = state.auth;

      if (!refreshToken) {
        stopTokenRefresh();
        return;
      }

      // RTK Query의 refreshToken mutation 호출
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Redux 상태 업데이트
      store.dispatch(
        setCredentials({
          user: state.auth.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || refreshToken,
        })
      );

      console.log('[TokenManager] Access token refreshed successfully');
    } catch (error) {
      console.error('[TokenManager] Token refresh failed:', error);
      // Refresh 실패 시 로그아웃 처리
      stopTokenRefresh();
      store.dispatch(logout());
    }
  }, TOKEN_REFRESH_INTERVAL);

  console.log('[TokenManager] Token refresh timer started');
};

/**
 * Access Token 자동 갱신 타이머 중지
 */
export const stopTokenRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    console.log('[TokenManager] Token refresh timer stopped');
  }
};

/**
 * 토큰 만료 여부 확인 (JWT decode)
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // seconds to milliseconds
    return Date.now() >= exp;
  } catch (error) {
    console.error('[TokenManager] Failed to decode token:', error);
    return true;
  }
};

/**
 * 토큰 남은 시간 (초)
 */
export const getTokenRemainingTime = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    const remaining = exp - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  } catch (error) {
    return 0;
  }
};
