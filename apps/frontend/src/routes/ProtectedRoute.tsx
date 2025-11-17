import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'ORG_ADMIN' | 'MEMBER';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const hasRequiredRole = () => {
      if (!user) return false;

      if (requiredRole === 'ADMIN') {
        return user.role === 'ADMIN';
      }

      if (requiredRole === 'ORG_ADMIN') {
        return user.role === 'ADMIN' || user.role === 'ORG_ADMIN';
      }

      return true;
    };

    if (!hasRequiredRole()) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
