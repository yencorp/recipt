import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // 초기 상태 설정
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // 리스너 함수
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // 이벤트 리스너 등록
    media.addEventListener('change', listener);

    // 정리
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// 편의 함수들
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1025px)');
}

export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
}
