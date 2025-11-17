import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { budgetItemSchema } from '@/schemas/budgetSchema';
import type { BudgetItemFormData } from '@/schemas/budgetSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface BudgetItemFormProps {
  onSubmit: (data: BudgetItemFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<BudgetItemFormData>;
  isIncome?: boolean;
}

export const BudgetItemForm: React.FC<BudgetItemFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  isIncome = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetItemFormData>({
    resolver: zodResolver(budgetItemSchema),
    defaultValues: defaultValues || {
      category: '',
      description: '',
      amount: 0,
      notes: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 카테고리 */}
      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium">
          카테고리 <span className="text-destructive">*</span>
        </label>
        <Input
          id="category"
          {...register('category')}
          placeholder={isIncome ? '예: 후원금, 참가비' : '예: 식사비, 물품비'}
          className={errors.category ? 'border-destructive' : ''}
        />
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* 설명 */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          항목 설명 <span className="text-destructive">*</span>
        </label>
        <Input
          id="description"
          {...register('description')}
          placeholder="항목에 대한 간단한 설명"
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* 금액 */}
      <div className="space-y-2">
        <label htmlFor="amount" className="text-sm font-medium">
          금액 <span className="text-destructive">*</span>
        </label>
        <Input
          id="amount"
          type="number"
          {...register('amount', { valueAsNumber: true })}
          placeholder="0"
          className={errors.amount ? 'border-destructive' : ''}
        />
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
      </div>

      {/* 비고 */}
      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          비고
        </label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="추가 메모 (선택사항)"
          rows={3}
        />
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">추가</Button>
      </div>
    </form>
  );
};
