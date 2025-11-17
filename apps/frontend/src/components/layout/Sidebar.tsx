import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

interface NavItem {
  name: string;
  path: string;
  icon?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: '대시보드', path: '/dashboard' },
  { name: '행사 관리', path: '/events' },
  { name: '블로그', path: '/blog' },
  { name: '내 프로필', path: '/profile' },
  { name: '관리자', path: '/admin', adminOnly: true },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { isAdmin } = useAuth();

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background z-40">
      <nav className="flex flex-col space-y-1 p-4">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
