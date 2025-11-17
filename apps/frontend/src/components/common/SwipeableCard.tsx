import { useState, useRef, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SwipeAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline';
  backgroundColor?: string;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number; // 스와이프 인식 임계값 (px)
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  disabled = false,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = offsetX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    const newOffset = currentXRef.current + diff;

    // 왼쪽/오른쪽 액션이 없으면 해당 방향으로 스와이프 제한
    if (newOffset > 0 && leftActions.length === 0) return;
    if (newOffset < 0 && rightActions.length === 0) return;

    // 최대 스와이프 거리 제한
    const maxSwipe = 150;
    if (Math.abs(newOffset) > maxSwipe) return;

    setOffsetX(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);

    // 임계값을 넘으면 액션 영역 고정
    if (offsetX > threshold && leftActions.length > 0) {
      setOffsetX(120);
      setIsRevealed('left');
    } else if (offsetX < -threshold && rightActions.length > 0) {
      setOffsetX(-120);
      setIsRevealed('right');
    } else {
      // 임계값 미달이면 원위치
      setOffsetX(0);
      setIsRevealed(null);
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onClick();
    // 액션 실행 후 원위치
    setOffsetX(0);
    setIsRevealed(null);
  };

  const resetPosition = () => {
    setOffsetX(0);
    setIsRevealed(null);
  };

  return (
    <div className="relative overflow-hidden">
      {/* 왼쪽 액션 버튼들 */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center gap-2 pl-2">
          {leftActions.map((action, index) => (
            <Button
              key={index}
              size="sm"
              variant={action.variant || 'default'}
              onClick={() => handleActionClick(action)}
              className={`h-full ${action.backgroundColor || ''}`}
            >
              {action.icon}
              <span className="ml-1">{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* 오른쪽 액션 버튼들 */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-2">
          {rightActions.map((action, index) => (
            <Button
              key={index}
              size="sm"
              variant={action.variant || 'default'}
              onClick={() => handleActionClick(action)}
              className={`h-full ${action.backgroundColor || ''}`}
            >
              {action.icon}
              <span className="ml-1">{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* 카드 컨텐츠 */}
      <div
        className={`relative transition-transform ${
          isDragging ? '' : 'duration-300 ease-out'
        }`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={isRevealed ? resetPosition : undefined}
      >
        <Card className="cursor-grab active:cursor-grabbing">
          <CardContent className="p-4">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
};
