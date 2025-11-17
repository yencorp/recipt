import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export interface QuickAction {
  label: string;
  description: string;
  icon: ReactNode;
  href: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  requiredRole?: string[];
}

export interface QuickActionsProps {
  actions: QuickAction[];
  userRole?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  userRole,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
  };

  const filteredActions = actions.filter(
    (action) =>
      !action.requiredRole ||
      (userRole && action.requiredRole.includes(userRole))
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {filteredActions.map((action, index) => (
        <Link
          key={index}
          to={action.href}
          className={cn(
            'block p-6 rounded-lg border border-gray-200 transition-all hover:shadow-md',
            colorClasses[action.color || 'blue']
          )}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="text-2xl">{action.icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="mt-1 text-xs opacity-75">{action.description}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
