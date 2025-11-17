import { z } from 'zod';

export const eventSchema = z.object({
  name: z.string().min(2, '행사명은 최소 2자 이상이어야 합니다'),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().min(1, '종료일을 선택해주세요'),
  location: z.string().optional(),
  allocatedBudget: z.number().min(0, '예산은 0 이상이어야 합니다').optional(),
  organizationId: z.string().min(1, '소속 단체를 선택해주세요'),
  description: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: '종료일은 시작일보다 이후여야 합니다',
  path: ['endDate'],
});

export type EventFormData = z.infer<typeof eventSchema>;
