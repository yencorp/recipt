import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { useLogoutMutation } from '@/store/api/authApi';
import { useDispatch } from 'react-redux';
import { logout as logoutAction } from '@/store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const [logoutMutation] = useLogoutMutation();

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      dispatch(logoutAction());
      navigate('/login');
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    isAdmin: user?.role === 'ADMIN',
    isOrgAdmin: user?.role === 'ORG_ADMIN' || user?.role === 'ADMIN',
    logout,
  };
};
