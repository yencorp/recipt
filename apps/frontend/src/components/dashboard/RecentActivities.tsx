import { RecentActivity } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface RecentActivitiesProps {
  activities: RecentActivity[];
}

export const RecentActivities: React.FC<RecentActivitiesProps> = ({
  activities,
}) => {
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'event_created':
        return '📅';
      case 'budget_submitted':
        return '💰';
      case 'settlement_approved':
        return '✅';
      case 'user_joined':
        return '👤';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'event_created':
        return 'text-blue-600 bg-blue-50';
      case 'budget_submitted':
        return 'text-green-600 bg-green-50';
      case 'settlement_approved':
        return 'text-purple-600 bg-purple-50';
      case 'user_joined':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        최근 활동이 없습니다
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {index !== activities.length - 1 && (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                <div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${getActivityColor(activity.type)}`}
                  >
                    <span className="text-lg">
                      {getActivityIcon(activity.type)}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {activity.description}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-medium">{activity.user.name}</span>
                    {' · '}
                    <span>
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
