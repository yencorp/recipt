import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SettlementItemFormData, settlementItemSchema } from '@/schemas/settlementSchema';

interface SettlementItemFormProps {
  onSubmit: (data: SettlementItemFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<SettlementItemFormData>;
  isEditMode?: boolean;
}

export const SettlementItemForm: React.FC<SettlementItemFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  isEditMode = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettlementItemFormData>({
    resolver: zodResolver(settlementItemSchema),
    defaultValues: defaultValues || {
      category: '',
      description: '',
      budgetAmount: 0,
      actualAmount: 0,
      notes: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">카테고리 *</Label>
          <Input
            id="category"
            {...register('category')}
            placeholder="예: 회비, 후원금, 장소대관"
          />
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">항목 설명 *</Label>
          <Input
            id="description"
            {...register('description')}
            placeholder="상세 설명"
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budgetAmount">예산 금액 (원) *</Label>
          <Input
            id="budgetAmount"
            type="number"
            {...register('budgetAmount', { valueAsNumber: true })}
            placeholder="0"
            min="0"
          />
          {errors.budgetAmount && (
            <p className="text-sm text-destructive">{errors.budgetAmount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="actualAmount">실제 금액 (원) *</Label>
          <Input
            id="actualAmount"
            type="number"
            {...register('actualAmount', { valueAsNumber: true })}
            placeholder="0"
            min="0"
          />
          {errors.actualAmount && (
            <p className="text-sm text-destructive">{errors.actualAmount.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">비고</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="추가 메모 (선택사항)"
          rows={3}
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">
          {isEditMode ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  );
};
