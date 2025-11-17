import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useCallback, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useLogoutMutation } from '@/store/api/authApi';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { UserRole } from '@/types';
import {
  startTokenRefresh,
  stopTokenRefresh,
  isTokenExpired,
} from '@/utils/tokenManager';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, accessToken } = useAppSelector(
    (state) => state.auth
  );
  const [logoutMutation] = useLogoutMutation();
  const hasCheckedToken = useRef(false);

  const logout = useCallback(async () => {
    try {
      // 토큰 갱신 타이머 중지
      stopTokenRefresh();

      // 백엔드 로그아웃 API 호출
      await logoutMutation().unwrap();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // Redux 상태 초기화 및 로그인 페이지로 이동
      dispatch(logoutAction());
      navigate('/login');
    }
  }, [dispatch, navigate, logoutMutation]);

  // 토큰 자동 갱신 로직
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // 토큰이 이미 만료되었는지 확인 (최초 1회만)
      if (!hasCheckedToken.current && isTokenExpired(accessToken)) {
        console.warn('[useAuth] Access token expired, logging out');
        hasCheckedToken.current = true;
        logout();
        return;
      }

      // 토큰 자동 갱신 시작
      startTokenRefresh();

      return () => {
        // 컴포넌트 언마운트 시 타이머 정리
        stopTokenRefresh();
      };
    } else {
      // 인증되지 않은 경우 타이머 중지
      stopTokenRefresh();
      hasCheckedToken.current = false;
    }
  }, [isAuthenticated, accessToken, logout]);

  return {
    user,
    isAuthenticated,
    loading,
    accessToken,
    refreshToken: useAppSelector((state) => state.auth.refreshToken),
    isAdmin: user?.role === UserRole.ADMIN,
    isOrgAdmin:
      user?.role === UserRole.ORG_ADMIN || user?.role === UserRole.ADMIN,
    isMember:
      user?.role === UserRole.MEMBER ||
      user?.role === UserRole.ORG_ADMIN ||
      user?.role === UserRole.ADMIN,
    logout,
  };
};
