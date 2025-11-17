import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Activity,
  Database,
  Server,
  Cpu,
} from 'lucide-react';

export type StatusLevel = 'healthy' | 'warning' | 'error';

export interface SystemMetric {
  name: string;
  value: string | number;
  status: StatusLevel;
  description?: string;
  unit?: string;
}

interface SystemStatusProps {
  metrics: SystemMetric[];
}

const getStatusIcon = (status: StatusLevel) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-600" />;
  }
};

const getStatusBadge = (status: StatusLevel) => {
  switch (status) {
    case 'healthy':
      return (
        <Badge variant="default" className="bg-green-600">
          정상
        </Badge>
      );
    case 'warning':
      return (
        <Badge variant="default" className="bg-yellow-600">
          주의
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive">오류</Badge>
      );
  }
};

const getCategoryIcon = (name: string) => {
  if (name.includes('API') || name.includes('응답')) {
    return <Activity className="w-5 h-5 text-muted-foreground" />;
  }
  if (name.includes('데이터베이스') || name.includes('DB')) {
    return <Database className="w-5 h-5 text-muted-foreground" />;
  }
  if (name.includes('서버') || name.includes('메모리')) {
    return <Server className="w-5 h-5 text-muted-foreground" />;
  }
  if (name.includes('CPU') || name.includes('프로세스')) {
    return <Cpu className="w-5 h-5 text-muted-foreground" />;
  }
  return <Activity className="w-5 h-5 text-muted-foreground" />;
};

export const SystemStatus: React.FC<SystemStatusProps> = ({ metrics }) => {
  const healthyCount = metrics.filter((m) => m.status === 'healthy').length;
  const warningCount = metrics.filter((m) => m.status === 'warning').length;
  const errorCount = metrics.filter((m) => m.status === 'error').length;

  const overallStatus: StatusLevel =
    errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'healthy';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            시스템 상태
          </CardTitle>
          {getStatusBadge(overallStatus)}
        </div>
        <div className="flex gap-4 mt-2 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-muted-foreground">정상: {healthyCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-muted-foreground">주의: {warningCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-muted-foreground">오류: {errorCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getCategoryIcon(metric.name)}
                <div>
                  <p className="font-medium">{metric.name}</p>
                  {metric.description && (
                    <p className="text-sm text-muted-foreground">
                      {metric.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {metric.value}
                    {metric.unit && (
                      <span className="text-sm text-muted-foreground ml-1">
                        {metric.unit}
                      </span>
                    )}
                  </p>
                </div>
                {getStatusIcon(metric.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
