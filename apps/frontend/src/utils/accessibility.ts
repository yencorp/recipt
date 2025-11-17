/**
 * 접근성 관련 유틸리티 함수
 */

/**
 * 색상 대비율 계산 (WCAG 2.1)
 * @param foreground 전경색 (hex)
 * @param background 배경색 (hex)
 * @returns 대비율 (1-21)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    // hex를 RGB로 변환
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    // sRGB to linear RGB
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLinear =
      rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear =
      gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear =
      bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    // Relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG 2.1 AA 대비 기준 충족 여부 확인
 * @param foreground 전경색
 * @param background 배경색
 * @param isLargeText 큰 텍스트 여부 (18pt+ 또는 14pt+ bold)
 * @returns AA 기준 충족 여부
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * WCAG 2.1 AAA 대비 기준 충족 여부 확인
 */
export function meetsWCAG_AAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * 요소에 적절한 ARIA 레이블이 있는지 확인
 */
export function hasAccessibleName(element: HTMLElement): boolean {
  return !!(
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.textContent?.trim() ||
    (element instanceof HTMLInputElement && element.labels?.length)
  );
}

/**
 * 포커스 가능한 요소 선택자
 */
export const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

/**
 * 요소가 포커스 가능한지 확인
 */
export function isFocusable(element: HTMLElement): boolean {
  return element.matches(FOCUSABLE_SELECTORS);
}

/**
 * 컨테이너 내의 모든 포커스 가능한 요소 가져오기
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS));
}

/**
 * 요소로 포커스 이동 (스크롤 포함)
 */
export function focusElement(element: HTMLElement, options?: FocusOptions) {
  element.focus(options);
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  });
}

/**
 * 키보드 이벤트가 접근성 관련 키인지 확인
 */
export function isAccessibilityKey(event: KeyboardEvent): boolean {
  const accessibilityKeys = [
    'Tab',
    'Enter',
    'Escape',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
    ' ', // Space
  ];
  return accessibilityKeys.includes(event.key);
}

/**
 * 요소가 화면에 보이는지 확인
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    window.getComputedStyle(element).visibility !== 'hidden' &&
    window.getComputedStyle(element).display !== 'none'
  );
}

/**
 * 스크린 리더 전용 텍스트 생성
 */
export function createSROnlyText(text: string): HTMLElement {
  const span = document.createElement('span');
  span.className = 'sr-only';
  span.textContent = text;
  return span;
}

/**
 * role에 따른 필수 ARIA 속성 검증
 */
export const requiredAriaProps: Record<string, string[]> = {
  button: [],
  checkbox: ['aria-checked'],
  radio: ['aria-checked'],
  tab: ['aria-selected'],
  tabpanel: ['aria-labelledby'],
  dialog: ['aria-labelledby', 'aria-describedby'],
  alertdialog: ['aria-labelledby', 'aria-describedby'],
  combobox: ['aria-expanded', 'aria-controls'],
  menu: [],
  menuitem: [],
  menuitemcheckbox: ['aria-checked'],
  menuitemradio: ['aria-checked'],
  option: ['aria-selected'],
  slider: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  spinbutton: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  switch: ['aria-checked'],
};

/**
 * 요소의 ARIA 속성이 올바른지 검증
 */
export function validateAriaProps(element: HTMLElement): {
  valid: boolean;
  missing: string[];
} {
  const role = element.getAttribute('role');
  if (!role || !requiredAriaProps[role]) {
    return { valid: true, missing: [] };
  }

  const required = requiredAriaProps[role];
  const missing = required.filter((prop) => !element.hasAttribute(prop));

  return {
    valid: missing.length === 0,
    missing,
  };
}
