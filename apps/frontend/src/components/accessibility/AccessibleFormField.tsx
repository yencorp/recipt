import { ReactNode, useId } from 'react';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface AccessibleFormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * 접근성을 고려한 폼 필드 래퍼
 * 자동으로 적절한 ARIA 속성과 ID를 연결합니다.
 */
export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  label,
  children,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
}) => {
  const fieldId = useId();
  const errorId = useId();
  const helperId = useId();

  // children에 필요한 props 추가
  const enhancedChildren = (
    typeof children === 'object' &&
    children !== null &&
    'type' in children
  ) ? {
    ...children,
    props: {
      ...children.props,
      id: fieldId,
      'aria-invalid': error ? 'true' : 'false',
      'aria-describedby': [
        error ? errorId : null,
        helperText ? helperId : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined,
      'aria-required': required,
      disabled,
    },
  } : children;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 레이블 */}
      <Label htmlFor={fieldId} className="flex items-center gap-1">
        {label}
        {required && (
          <span className="text-destructive" aria-label="필수">
            *
          </span>
        )}
      </Label>

      {/* 입력 필드 */}
      {enhancedChildren}

      {/* 도움말 텍스트 */}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div
          id={errorId}
          className="flex items-center gap-1 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
