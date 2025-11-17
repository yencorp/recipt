import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  Home,
  Calendar,
  FileText,
  Receipt,
  Users,
  Building2,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  requiredRole?: string[];
}

interface MobileNavProps {
  userRole?: string;
  onLogout?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ userRole, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: '/dashboard', label: '대시보드', icon: Home },
    { path: '/events', label: '행사 관리', icon: Calendar },
    { path: '/budgets', label: '예산서', icon: FileText },
    { path: '/settlements', label: '결산서', icon: Receipt },
    {
      path: '/admin/users',
      label: '사용자 관리',
      icon: Users,
      requiredRole: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      path: '/admin/organizations',
      label: '단체 관리',
      icon: Building2,
      requiredRole: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      path: '/admin/dashboard',
      label: '시스템 모니터링',
      icon: BarChart3,
      requiredRole: ['SUPER_ADMIN', 'ADMIN'],
    },
    { path: '/settings', label: '설정', icon: Settings },
  ];

  const hasAccess = (item: NavItem) => {
    if (!item.requiredRole || !userRole) return true;
    return item.requiredRole.includes(userRole);
  };

  const visibleItems = navItems.filter(hasAccess);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
          <span className="sr-only">메뉴 열기</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>메뉴</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-6">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
          <div className="border-t my-2" />
          {onLogout && (
            <button
              onClick={() => {
                handleNavClick();
                onLogout();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-destructive hover:text-destructive-foreground text-destructive"
            >
              <LogOut className="w-5 h-5" />
              <span className="flex-1 font-medium">로그아웃</span>
            </button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
