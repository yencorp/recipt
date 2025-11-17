import { ReactNode } from 'react';

interface LiveRegionProps {
  children: ReactNode;
  /**
   * polite: 사용자 작업이 끝난 후 알림
   * assertive: 즉시 알림
   * off: 알림 없음
   */
  politeness?: 'polite' | 'assertive' | 'off';
  /**
   * additions: 추가된 콘텐츠만 알림
   * removals: 제거된 콘텐츠만 알림
   * text: 텍스트 변경만 알림
   * all: 모든 변경 알림
   */
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  /**
   * true: 전체 영역 다시 읽기
   * false: 변경된 부분만 읽기
   */
  atomic?: boolean;
  className?: string;
}

/**
 * 스크린 리더를 위한 라이브 리전 컴포넌트
 * 동적 콘텐츠 변경을 실시간으로 알립니다.
 */
export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  relevant = 'additions',
  atomic = false,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-relevant={relevant}
      aria-atomic={atomic}
      className={className}
    >
      {children}
    </div>
  );
};

/**
 * 중요하지 않은 상태 메시지용
 * 예: "저장 중...", "로딩 중..."
 */
export const StatusMessage: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <LiveRegion politeness="polite" className={className}>
    {children}
  </LiveRegion>
);

/**
 * 중요한 알림 메시지용
 * 예: "오류가 발생했습니다", "작업이 완료되었습니다"
 */
export const AlertMessage: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <LiveRegion politeness="assertive" relevant="all" atomic={true} className={className}>
    {children}
  </LiveRegion>
);
