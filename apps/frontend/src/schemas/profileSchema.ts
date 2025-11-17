import { z } from 'zod';

export const profileUpdateSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  baptismalName: z.string().optional(),
  phone: z
    .string()
    .min(1, '연락처를 입력해주세요')
    .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 연락처 형식이 아닙니다'),
  position: z.string().min(1, '직책을 입력해주세요'),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
    newPassword: z
      .string()
      .min(6, '비밀번호는 최소 6자 이상이어야 합니다')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다'
      ),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
