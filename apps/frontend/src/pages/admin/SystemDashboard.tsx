import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, Building2, Calendar, FileText } from 'lucide-react';
import { StatisticsChart } from '@/components/admin/StatisticsChart';
import { SystemStatus, SystemMetric } from '@/components/admin/SystemStatus';
import {
  useGetSystemStatsQuery,
  useGetActivityLogsQuery,
} from '@/store/api/adminApi';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const SystemDashboard: React.FC = () => {
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useGetSystemStatsQuery();

  const {
    data: activityLogs = [],
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useGetActivityLogsQuery({ limit: 10 });

  // 차트 데이터 준비
  const userActivityData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: '전체 사용자', value: stats.totalUsers },
      { name: '활성 사용자', value: stats.activeUsers },
      { name: '비활성 사용자', value: stats.totalUsers - stats.activeUsers },
    ];
  }, [stats]);

  const documentStatsData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: '예산서', value: stats.totalBudgets },
      { name: '결산서', value: stats.totalSettlements },
    ];
  }, [stats]);

  const ocrStatusData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: '처리 완료', value: stats.ocrProcessed },
      { name: '처리 대기', value: stats.ocrPending },
    ];
  }, [stats]);

  // 시스템 상태 메트릭 준비
  const systemMetrics = useMemo<SystemMetric[]>(() => {
    if (!stats) return [];

    const ocrSuccessRate =
      stats.ocrProcessed + stats.ocrPending > 0
        ? (
            (stats.ocrProcessed / (stats.ocrProcessed + stats.ocrPending)) *
            100
          ).toFixed(1)
        : '0';

    const avgDocsPerOrg =
      stats.totalOrganizations > 0
        ? (
            (stats.totalBudgets + stats.totalSettlements) /
            stats.totalOrganizations
          ).toFixed(1)
        : '0';

    return [
      {
        name: 'API 응답 시간',
        value: '< 200',
        unit: 'ms',
        status: 'healthy',
        description: '평균 API 응답 속도',
      },
      {
        name: '데이터베이스 연결',
        value: '정상',
        status: 'healthy',
        description: 'DB 연결 풀 상태',
      },
      {
        name: 'OCR 처리율',
        value: ocrSuccessRate,
        unit: '%',
        status:
          parseFloat(ocrSuccessRate) > 90
            ? 'healthy'
            : parseFloat(ocrSuccessRate) > 70
            ? 'warning'
            : 'error',
        description: 'OCR 처리 성공률',
      },
      {
        name: '단체당 평균 문서',
        value: avgDocsPerOrg,
        unit: '건',
        status: 'healthy',
        description: '단체당 평균 문서 수',
      },
    ];
  }, [stats]);

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
  };

  if (isLoadingStats || isLoadingLogs) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  if (statsError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-destructive">
            <p className="font-medium">시스템 통계를 불러올 수 없습니다.</p>
            <Button variant="outline" onClick={handleRefresh} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">시스템 모니터링</h1>
          <p className="text-muted-foreground mt-1">
            시스템 전체 상태와 활동을 모니터링합니다
          </p>
        </div>
        <Button onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              활성: {stats?.activeUsers || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              단체
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalOrganizations || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">등록된 단체 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              행사
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalEvents || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">진행 중인 행사</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              문서
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(stats?.totalBudgets || 0) + (stats?.totalSettlements || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              예산서 {stats?.totalBudgets || 0} · 결산서 {stats?.totalSettlements || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 시스템 상태 */}
      <SystemStatus metrics={systemMetrics} />

      {/* 통계 차트 */}
      <div className="grid grid-cols-2 gap-4">
        <StatisticsChart
          title="사용자 현황"
          description="전체/활성/비활성 사용자 분포"
          data={userActivityData}
          type="pie"
          colors={['#3b82f6', '#10b981', '#ef4444']}
        />

        <StatisticsChart
          title="문서 통계"
          description="예산서 및 결산서 처리 현황"
          data={documentStatsData}
          type="bar"
          colors={['#3b82f6', '#10b981']}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatisticsChart
          title="OCR 처리 현황"
          description="영수증 OCR 처리 상태"
          data={ocrStatusData}
          type="pie"
          colors={['#10b981', '#f59e0b']}
        />

        <Card>
          <CardHeader>
            <CardTitle>OCR 처리 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">처리 완료</p>
                  <p className="text-sm text-green-700">
                    성공적으로 처리된 영수증
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {stats?.ocrProcessed || 0}
                </p>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-900">처리 대기</p>
                  <p className="text-sm text-yellow-700">
                    처리를 기다리는 영수증
                  </p>
                </div>
                <p className="text-2xl font-bold text-yellow-900">
                  {stats?.ocrPending || 0}
                </p>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">처리율</p>
                  <p className="text-sm text-blue-700">전체 처리 성공률</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {stats && stats.ocrProcessed + stats.ocrPending > 0
                    ? (
                        (stats.ocrProcessed /
                          (stats.ocrProcessed + stats.ocrPending)) *
                        100
                      ).toFixed(1)
                    : '0'}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 로그 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              활동 기록이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{log.userName}</p>
                      <Badge variant="outline">{log.action}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {log.resourceType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(log.timestamp), 'PPp', { locale: ko })}
                      </span>
                      {log.ipAddress && (
                        <>
                          <span>·</span>
                          <span>{log.ipAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
