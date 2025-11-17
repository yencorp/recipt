import { useEffect, useRef } from 'react';

/**
 * 포커스를 특정 요소 내부에 가두는 훅
 * 모달, 드롭다운 등에서 키보드 접근성을 위해 사용
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isActive: boolean = true
) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // 현재 포커스된 요소 저장
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;

    // 포커스 가능한 요소 선택자
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    // 포커스 가능한 요소들 가져오기
    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll(focusableSelectors));
    };

    // 첫 번째 포커스 가능한 요소에 포커스
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Tab 키 핸들러
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (e.shiftKey) {
        // Shift + Tab: 뒤로 이동
        if (activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: 앞으로 이동
        if (activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // 정리
    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // 이전에 포커스된 요소로 복원
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}
