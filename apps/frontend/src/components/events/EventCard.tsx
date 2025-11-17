import type { Event } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onCreateBudget?: (event: Event) => void;
  onCreateSettlement?: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onEdit,
  onDelete,
  onCreateBudget,
  onCreateSettlement,
}) => {
  const { isAdmin, isOrgAdmin, user } = useAuth();

  const getStatusVariant = (status: Event['status']) => {
    switch (status) {
      case 'PLANNING':
        return 'secondary' as const;
      case 'IN_PROGRESS':
        return 'default' as const;
      case 'COMPLETED':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getStatusLabel = (status: Event['status']) => {
    switch (status) {
      case 'PLANNING':
        return '준비중';
      case 'IN_PROGRESS':
        return '진행중';
      case 'COMPLETED':
        return '완료';
      default:
        return status;
    }
  };

  const canEdit = isAdmin || isOrgAdmin || event.createdBy.id === user?.id;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold">{event.title}</h3>
              <Badge variant={getStatusVariant(event.status)}>
                {getStatusLabel(event.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {event.organization.name}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">기간</p>
            <p className="mt-1 font-medium">
              {format(new Date(event.startDate), 'yyyy.MM.dd', { locale: ko })} ~{' '}
              {format(new Date(event.endDate), 'yyyy.MM.dd', { locale: ko })}
            </p>
          </div>
          {event.location && (
            <div>
              <p className="text-muted-foreground">장소</p>
              <p className="mt-1 font-medium">{event.location}</p>
            </div>
          )}
          {event.estimatedCost && (
            <div>
              <p className="text-muted-foreground">예상 비용</p>
              <p className="mt-1 font-medium">
                {event.estimatedCost.toLocaleString()}원
              </p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">작성자</p>
            <p className="mt-1 font-medium">{event.createdBy.name}</p>
          </div>
        </div>

        {/* 진행 상태 표시 */}
        <div className="mt-4 flex items-center gap-2">
          <Badge variant={event.hasBudget ? 'default' : 'secondary'}>
            {event.hasBudget ? '✓ 예산서 작성완료' : '예산서 미작성'}
          </Badge>
          <Badge variant={event.hasSettlement ? 'default' : 'secondary'}>
            {event.hasSettlement ? '✓ 결산서 작성완료' : '결산서 미작성'}
          </Badge>
        </div>
      </CardContent>

      {canEdit && (
        <CardFooter className="border-t bg-muted/50">
          <div className="flex items-center justify-end w-full gap-2">
            {!event.hasBudget && onCreateBudget && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateBudget(event)}
              >
                예산서 작성
              </Button>
            )}
            {!event.hasSettlement && onCreateSettlement && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateSettlement(event)}
              >
                결산서 작성
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(event)}
              >
                편집
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(event)}
                className="text-destructive hover:text-destructive"
              >
                삭제
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
