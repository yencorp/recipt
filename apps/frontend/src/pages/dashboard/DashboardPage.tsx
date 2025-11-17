import { useAuth } from '@/hooks/useAuth';
import { DashboardWidget, StatCard } from '@/components/dashboard/DashboardWidget';
import { QuickActions, QuickAction } from '@/components/dashboard/QuickActions';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { RecentActivity } from '@/types';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin, isOrgAdmin } = useAuth();

  // Mock 데이터 - 실제로는 API에서 가져와야 함
  const stats = {
    totalEvents: 12,
    upcomingEvents: 5,
    completedEvents: 7,
    totalBudget: 15000000,
    totalExpenditure: 12500000,
    pendingApprovals: 3,
  };

  const quickActions: QuickAction[] = [
    {
      label: '새 행사 등록',
      description: '새로운 행사를 등록합니다',
      icon: '➕',
      href: '/events/new',
      color: 'blue',
      requiredRole: ['ADMIN', 'ORG_ADMIN'],
    },
    {
      label: '행사 목록',
      description: '모든 행사를 확인합니다',
      icon: '📋',
      href: '/events',
      color: 'green',
    },
    {
      label: '예산서 작성',
      description: '행사 예산서를 작성합니다',
      icon: '💰',
      href: '/events',
      color: 'purple',
      requiredRole: ['ADMIN', 'ORG_ADMIN', 'MEMBER'],
    },
    {
      label: '블로그',
      description: '공지사항을 확인합니다',
      icon: '📰',
      href: '/blog',
      color: 'orange',
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'event_created',
      title: '새 행사가 등록되었습니다',
      description: '청소년 여름 수련회',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      user: { name: '김철수', role: '조직 관리자' },
    },
    {
      id: '2',
      type: 'budget_submitted',
      title: '예산서가 제출되었습니다',
      description: '청소년 여름 수련회 예산서',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      user: { name: '박영희', role: '회계' },
    },
    {
      id: '3',
      type: 'settlement_approved',
      title: '결산서가 승인되었습니다',
      description: '청소년 봄 나들이 결산서',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      user: { name: '이민수', role: '관리자' },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          환영합니다, {user?.name}님!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          광남동성당 청소년위원회 예결산 관리 시스템 대시보드입니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="총 행사"
          value={stats.totalEvents}
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          color="blue"
        />

        <StatCard
          label="예정된 행사"
          value={stats.upcomingEvents}
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="green"
        />

        <StatCard
          label="총 예산"
          value={`${(stats.totalBudget / 10000).toLocaleString()}만원`}
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="yellow"
        />
      </div>

      {/* 빠른 작업 */}
      <DashboardWidget title="빠른 작업">
        <QuickActions actions={quickActions} userRole={user?.role} />
      </DashboardWidget>

      {/* 최근 활동 및 대기 중인 승인 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardWidget title="최근 활동">
          <RecentActivities activities={recentActivities} />
        </DashboardWidget>

        {(isAdmin || isOrgAdmin) && (
          <DashboardWidget
            title="대기 중인 승인"
            action={
              <a
                href="/admin/approvals"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                전체 보기 →
              </a>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    예산서 승인 대기
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    청소년 여름 수련회
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  대기중
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    결산서 승인 대기
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    청소년 봄 캠프
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  대기중
                </span>
              </div>
            </div>
          </DashboardWidget>
        )}
      </div>
    </div>
  );
};
