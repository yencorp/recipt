import { z } from 'zod';

// 결산 항목 스키마
export const settlementItemSchema = z.object({
  category: z.string().min(1, '카테고리를 입력해주세요'),
  description: z.string().min(1, '항목 설명을 입력해주세요'),
  budgetAmount: z.number().min(0, '예산 금액은 0 이상이어야 합니다'),
  actualAmount: z.number().min(0, '실제 금액은 0 이상이어야 합니다'),
  notes: z.string().optional(),
  receiptIds: z.array(z.string()).optional(),
});

// 결산서 생성 스키마
export const createSettlementSchema = z.object({
  eventId: z.string().uuid('유효한 행사를 선택해주세요'),
  budgetId: z.string().uuid('예산서가 필요합니다'),
  incomeItems: z.array(settlementItemSchema).min(1, '최소 1개의 수입 항목이 필요합니다'),
  expenseItems: z.array(settlementItemSchema).min(1, '최소 1개의 지출 항목이 필요합니다'),
  notes: z.string().optional(),
});

export type SettlementItemFormData = z.infer<typeof settlementItemSchema>;
export type CreateSettlementFormData = z.infer<typeof createSettlementSchema>;
