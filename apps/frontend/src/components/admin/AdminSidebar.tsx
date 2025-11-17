import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  BarChart3,
  FileText,
  Bell,
  Shield,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  requiredRole?: ('SUPER_ADMIN' | 'ADMIN' | 'MANAGER')[];
}

interface AdminSidebarProps {
  userRole: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'QA';
  className?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  userRole,
  className,
}) => {
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      title: '대시보드',
      href: '/admin/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      title: '사용자 관리',
      href: '/admin/users',
      icon: <Users className="w-5 h-5" />,
      requiredRole: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      title: '단체 관리',
      href: '/admin/organizations',
      icon: <Building2 className="w-5 h-5" />,
      requiredRole: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      title: '시스템 통계',
      href: '/admin/statistics',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      title: '활동 로그',
      href: '/admin/activity-logs',
      icon: <Activity className="w-5 h-5" />,
      requiredRole: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      title: '권한 관리',
      href: '/admin/permissions',
      icon: <Shield className="w-5 h-5" />,
      requiredRole: ['SUPER_ADMIN'],
    },
    {
      title: '알림 관리',
      href: '/admin/notifications',
      icon: <Bell className="w-5 h-5" />,
    },
    {
      title: '시스템 설정',
      href: '/admin/settings',
      icon: <Settings className="w-5 h-5" />,
      requiredRole: ['SUPER_ADMIN', 'ADMIN'],
    },
  ];

  const hasAccess = (item: MenuItem) => {
    if (!item.requiredRole) return true;
    return item.requiredRole.includes(userRole);
  };

  const visibleMenuItems = menuItems.filter(hasAccess);

  return (
    <aside
      className={cn(
        'w-64 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto',
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold">관리자 패널</h2>
        </div>

        <nav className="space-y-1">
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.icon}
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 사용자 역할 표시 */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">현재 권한</p>
              <p className="text-sm font-medium">
                {userRole === 'SUPER_ADMIN'
                  ? '최고 관리자'
                  : userRole === 'ADMIN'
                    ? '관리자'
                    : userRole === 'MANAGER'
                      ? '매니저'
                      : userRole}
              </p>
            </div>
          </div>
        </div>

        {/* 일반 사용자 페이지로 돌아가기 */}
        <div className="mt-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>일반 사용자 모드</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};
