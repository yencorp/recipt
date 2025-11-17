import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number' | 'date';
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  confidence?: number; // OCR 신뢰도 (0-1)
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  type = 'text',
  className,
  placeholder,
  disabled = false,
  confidence,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // 신뢰도에 따른 배경색 설정
  const getConfidenceColor = () => {
    if (!confidence) return '';
    if (confidence >= 0.9) return 'bg-green-50 hover:bg-green-100';
    if (confidence >= 0.7) return 'bg-yellow-50 hover:bg-yellow-100';
    return 'bg-red-50 hover:bg-red-100';
  };

  if (disabled) {
    return (
      <div className={cn('px-2 py-1 text-sm text-muted-foreground', className)}>
        {value || placeholder}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) =>
            setEditValue(
              type === 'number' ? Number(e.target.value) : e.target.value
            )
          }
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-8 text-sm"
          placeholder={placeholder}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-8 w-8 p-0"
        >
          <Check className="w-4 h-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors',
        getConfidenceColor(),
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <span className="text-sm flex-1">
        {type === 'number' && typeof value === 'number'
          ? value.toLocaleString()
          : value || placeholder}
      </span>
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
      {confidence !== undefined && (
        <div className="absolute top-0 right-0 -mt-1 -mr-1">
          <div
            className={cn(
              'text-xs px-1 rounded',
              confidence >= 0.9
                ? 'bg-green-600 text-white'
                : confidence >= 0.7
                  ? 'bg-yellow-600 text-white'
                  : 'bg-red-600 text-white'
            )}
          >
            {Math.round(confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};
