import { useEffect, useRef, useState } from 'react';

interface UseKeyboardNavOptions {
  itemCount: number;
  onSelect?: (index: number) => void;
  loop?: boolean; // 처음/끝에서 순환 여부
  orientation?: 'vertical' | 'horizontal';
  initialIndex?: number;
}

/**
 * 키보드 방향키로 항목 탐색을 지원하는 훅
 * 리스트, 메뉴, 탭 등에서 사용
 */
export function useKeyboardNav({
  itemCount,
  onSelect,
  loop = true,
  orientation = 'vertical',
  initialIndex = -1,
}: UseKeyboardNavOptions) {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let nextIndex = focusedIndex;
      let handled = false;

      if (orientation === 'vertical') {
        switch (e.key) {
          case 'ArrowDown':
            nextIndex = focusedIndex + 1;
            handled = true;
            break;
          case 'ArrowUp':
            nextIndex = focusedIndex - 1;
            handled = true;
            break;
          case 'Home':
            nextIndex = 0;
            handled = true;
            break;
          case 'End':
            nextIndex = itemCount - 1;
            handled = true;
            break;
        }
      } else {
        switch (e.key) {
          case 'ArrowRight':
            nextIndex = focusedIndex + 1;
            handled = true;
            break;
          case 'ArrowLeft':
            nextIndex = focusedIndex - 1;
            handled = true;
            break;
          case 'Home':
            nextIndex = 0;
            handled = true;
            break;
          case 'End':
            nextIndex = itemCount - 1;
            handled = true;
            break;
        }
      }

      if (e.key === 'Enter' || e.key === ' ') {
        if (focusedIndex >= 0 && focusedIndex < itemCount) {
          onSelect?.(focusedIndex);
          handled = true;
        }
      }

      if (handled) {
        e.preventDefault();

        // 범위 체크 및 순환 처리
        if (nextIndex < 0) {
          nextIndex = loop ? itemCount - 1 : 0;
        } else if (nextIndex >= itemCount) {
          nextIndex = loop ? 0 : itemCount - 1;
        }

        setFocusedIndex(nextIndex);
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, itemCount, onSelect, loop, orientation]);

  const getItemProps = (index: number) => ({
    tabIndex: focusedIndex === index ? 0 : -1,
    'aria-selected': focusedIndex === index,
    onFocus: () => setFocusedIndex(index),
    onMouseEnter: () => setFocusedIndex(index),
  });

  const resetFocus = () => setFocusedIndex(initialIndex);

  return {
    containerRef,
    focusedIndex,
    setFocusedIndex,
    getItemProps,
    resetFocus,
  };
}
