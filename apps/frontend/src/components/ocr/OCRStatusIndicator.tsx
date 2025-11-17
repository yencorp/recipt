import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { OCRResult } from '@/store/api/ocrApi';
import { cn } from '@/lib/utils';

interface OCRStatusIndicatorProps {
  results: OCRResult[];
  className?: string;
}

export const OCRStatusIndicator: React.FC<OCRStatusIndicatorProps> = ({
  results,
  className,
}) => {
  const totalCount = results.length;
  const completedCount = results.filter((r) => r.status === 'completed').length;
  const processingCount = results.filter((r) => r.status === 'processing').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const pendingCount = results.filter((r) => r.status === 'pending').length;

  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getStatusIcon = (status: OCRResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: OCRResult['status']) => {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'processing':
        return '처리 중';
      case 'completed':
        return '완료';
      case 'failed':
        return '실패';
      default:
        return '알 수 없음';
    }
  };

  const getStatusVariant = (status: OCRResult['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary' as const;
      case 'processing':
        return 'default' as const;
      case 'completed':
        return 'default' as const;
      case 'failed':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* 전체 진행 상황 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">OCR 처리 진행 상황</h3>
              <span className="text-sm text-muted-foreground">
                {completedCount} / {totalCount}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* 상태별 통계 */}
          <div className="grid grid-cols-4 gap-2">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 p-2 border rounded">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">대기</span>
                  <span className="text-sm font-medium">{pendingCount}</span>
                </div>
              </div>
            )}

            {processingCount > 0 && (
              <div className="flex items-center gap-2 p-2 border rounded">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">처리 중</span>
                  <span className="text-sm font-medium">{processingCount}</span>
                </div>
              </div>
            )}

            {completedCount > 0 && (
              <div className="flex items-center gap-2 p-2 border rounded">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">완료</span>
                  <span className="text-sm font-medium">{completedCount}</span>
                </div>
              </div>
            )}

            {failedCount > 0 && (
              <div className="flex items-center gap-2 p-2 border rounded">
                <XCircle className="w-4 h-4 text-destructive" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">실패</span>
                  <span className="text-sm font-medium">{failedCount}</span>
                </div>
              </div>
            )}
          </div>

          {/* 개별 영수증 상태 */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-2 border rounded text-sm"
              >
                <div className="flex items-center gap-2 flex-1">
                  {getStatusIcon(result.status)}
                  <span className="font-medium truncate">
                    {result.merchantName || `영수증 ${result.receiptId.slice(0, 8)}`}
                  </span>
                </div>
                <Badge variant={getStatusVariant(result.status)}>
                  {getStatusLabel(result.status)}
                </Badge>
              </div>
            ))}
          </div>

          {/* 평균 신뢰도 */}
          {completedCount > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">평균 인식 정확도</span>
                <span className="font-medium">
                  {Math.round(
                    (results
                      .filter((r) => r.status === 'completed' && r.confidence)
                      .reduce((sum, r) => sum + (r.confidence || 0), 0) /
                      completedCount) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
