import { z } from 'zod';

// 예산 항목 스키마
export const budgetItemSchema = z.object({
  category: z.string().min(1, '카테고리를 입력해주세요'),
  description: z.string().min(1, '항목 설명을 입력해주세요'),
  amount: z.number().min(0, '금액은 0 이상이어야 합니다'),
  notes: z.string().optional(),
});

// 수입 항목 스키마
export const incomeItemSchema = budgetItemSchema;

// 지출 항목 스키마
export const expenseItemSchema = budgetItemSchema;

// 예산서 생성 스키마
export const createBudgetSchema = z.object({
  eventId: z.string().uuid('유효한 행사를 선택해주세요'),
  incomeItems: z.array(incomeItemSchema).min(1, '최소 1개의 수입 항목이 필요합니다'),
  expenseItems: z.array(expenseItemSchema).min(1, '최소 1개의 지출 항목이 필요합니다'),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const totalIncome = data.incomeItems.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = data.expenseItems.reduce((sum, item) => sum + item.amount, 0);
    return totalIncome >= totalExpense;
  },
  {
    message: '총 수입이 총 지출보다 크거나 같아야 합니다',
    path: ['expenseItems'],
  }
);

export type BudgetItemFormData = z.infer<typeof budgetItemSchema>;
export type IncomeItemFormData = z.infer<typeof incomeItemSchema>;
export type ExpenseItemFormData = z.infer<typeof expenseItemSchema>;
export type CreateBudgetFormData = z.infer<typeof createBudgetSchema>;
