import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useLogoutMutation } from '@/store/api/authApi';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { UserRole } from '@/types';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, accessToken } = useAppSelector(
    (state) => state.auth
  );
  const [logoutMutation] = useLogoutMutation();

  const logout = useCallback(async () => {
    try {
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
