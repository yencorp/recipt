import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateUserMutation } from '@/store/api/adminApi';
import type { AdminUser } from '@/store/api/adminApi';
import { useGetOrganizationsQuery } from '@/store/api/organizationsApi';

const userEditSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER', 'QA']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  organizationId: z.string().optional(),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

interface UserEditModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const { data: organizations = [] } = useGetOrganizationsQuery();
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UserEditFormData) => {
    if (!user) return;

    try {
      await updateUser({
        id: user.id,
        data: {
          name: data.name,
          role: data.role,
          status: data.status,
          organizationId: data.organizationId || undefined,
        },
      }).unwrap();

      alert('사용자 정보가 수정되었습니다.');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('사용자 정보 수정 실패:', error);
      alert('사용자 정보 수정에 실패했습니다.');
    }
  };

  const roleValue = watch('role');
  const statusValue = watch('status');
  const organizationIdValue = watch('organizationId');

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>사용자 정보 수정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 이메일 (읽기 전용) */}
          <div className="space-y-2">
            <Label>이메일</Label>
            <Input value={user.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              이메일은 변경할 수 없습니다.
            </p>
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input id="name" {...register('name')} placeholder="이름 입력" />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* 역할 */}
          <div className="space-y-2">
            <Label htmlFor="role">역할 *</Label>
            <Select value={roleValue} onValueChange={(value) => setValue('role', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">최고관리자</SelectItem>
                <SelectItem value="ADMIN">관리자</SelectItem>
                <SelectItem value="MANAGER">매니저</SelectItem>
                <SelectItem value="USER">사용자</SelectItem>
                <SelectItem value="QA">QA</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* 상태 */}
          <div className="space-y-2">
            <Label htmlFor="status">상태 *</Label>
            <Select
              value={statusValue}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">활성</SelectItem>
                <SelectItem value="INACTIVE">비활성</SelectItem>
                <SelectItem value="SUSPENDED">정지</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* 단체 */}
          <div className="space-y-2">
            <Label htmlFor="organizationId">소속 단체</Label>
            <Select
              value={organizationIdValue || 'none'}
              onValueChange={(value) =>
                setValue('organizationId', value === 'none' ? '' : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="단체 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">없음</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
