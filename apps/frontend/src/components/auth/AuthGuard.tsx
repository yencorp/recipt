import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
}

/**
 * 권한 기반 컴포넌트 렌더링 가드
 *
 * @example
 * <AuthGuard requiredRole="ADMIN">
 *   <AdminOnlyButton />
 * </AuthGuard>
 *
 * <AuthGuard requiredRoles={['ADMIN', 'ORG_ADMIN']}>
 *   <ManagementPanel />
 * </AuthGuard>
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
  requiredRoles,
  fallback = null,
}) => {
  const { user, isAuthenticated } = useAuth();

  // 인증되지 않은 경우
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // 특정 역할 필요 (단일)
  if (requiredRole && user.role !== requiredRole) {
    // ADMIN은 모든 권한 가짐
    if (user.role !== UserRole.ADMIN) {
      return <>{fallback}</>;
    }
  }

  // 특정 역할 필요 (복수)
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    const isAdmin = user.role === UserRole.ADMIN;

    if (!hasRequiredRole && !isAdmin) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

/**
 * 관리자 전용 컴포넌트 가드
 */
export const AdminOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback,
}) => {
  return (
    <AuthGuard requiredRole={UserRole.ADMIN} fallback={fallback}>
      {children}
    </AuthGuard>
  );
};

/**
 * 조직 관리자 이상 권한 가드
 */
export const OrgAdminOrHigher: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => {
  return (
    <AuthGuard
      requiredRoles={[UserRole.ADMIN, UserRole.ORG_ADMIN]}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  );
};

/**
 * 일반 회원 이상 권한 가드 (QA, USER 제외)
 */
export const MemberOrHigher: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => {
  return (
    <AuthGuard
      requiredRoles={[UserRole.ADMIN, UserRole.ORG_ADMIN, UserRole.MEMBER]}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  );
};
