import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '@/store/slices/uiSlice';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const dispatch = useDispatch();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Menu Button */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="mr-4 p-2 hover:bg-accent rounded-md"
          aria-label="메뉴 토글"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-2">
          <span className="font-bold text-xl">광남동성당 예결산</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {user?.name} ({user?.position})
          </span>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
};
