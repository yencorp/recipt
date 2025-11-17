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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
} from '@/store/api/organizationsApi';

const organizationSchema = z.object({
  name: z.string().min(2, '단체명은 최소 2자 이상이어야 합니다'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface Organization {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

interface OrganizationEditModalProps {
  organization: Organization | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OrganizationEditModal: React.FC<OrganizationEditModalProps> = ({
  organization,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isEditMode = !!organization;
  const [createOrganization, { isLoading: isCreating }] =
    useCreateOrganizationMutation();
  const [updateOrganization, { isLoading: isUpdating }] =
    useUpdateOrganizationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (organization) {
      reset({
        name: organization.name,
        description: organization.description || '',
        isActive: organization.isActive ?? true,
      });
    } else {
      reset({
        name: '',
        description: '',
        isActive: true,
      });
    }
  }, [organization, reset]);

  const isActive = watch('isActive');

  const onSubmit = async (data: OrganizationFormData) => {
    try {
      if (isEditMode) {
        await updateOrganization({
          id: organization.id,
          organization: {
            name: data.name,
            description: data.description || undefined,
          },
        }).unwrap();
        alert('단체 정보가 수정되었습니다.');
      } else {
        await createOrganization({
          name: data.name,
          description: data.description || undefined,
        }).unwrap();
        alert('단체가 생성되었습니다.');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('단체 저장 실패:', error);
      alert(`단체 ${isEditMode ? '수정' : '생성'}에 실패했습니다.`);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? '단체 정보 수정' : '새 단체 추가'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 단체명 */}
          <div className="space-y-2">
            <Label htmlFor="name">단체명 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="단체명 입력"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="단체에 대한 간단한 설명"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* 활성 상태 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              단체 활성화
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditMode
                  ? '수정 중...'
                  : '생성 중...'
                : isEditMode
                  ? '수정'
                  : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
