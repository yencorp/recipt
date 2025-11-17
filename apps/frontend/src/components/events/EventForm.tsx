import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema } from '@/schemas/eventSchema';
import type { EventFormData } from '@/schemas/eventSchema';
import {
  useCreateEventMutation,
  useUpdateEventMutation,
} from '@/store/api/eventsApi';
import { useGetOrganizationsQuery } from '@/store/api/organizationsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Event } from '@/types';

interface EventFormProps {
  event?: Event;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  event,
  onSuccess,
  onCancel,
}) => {
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const { data: organizations, isLoading: isLoadingOrgs } =
    useGetOrganizationsQuery();

  const isEditMode = !!event;
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event
      ? {
          name: event.name,
          startDate: event.startDate.split('T')[0],
          endDate: event.endDate.split('T')[0],
          location: event.location || '',
          allocatedBudget: event.allocatedBudget || undefined,
          organizationId: event.organization.id,
          description: event.description || '',
        }
      : {
          name: '',
          startDate: '',
          endDate: '',
          location: '',
          allocatedBudget: undefined,
          organizationId: '',
          description: '',
        },
  });

  const selectedOrg = watch('organizationId');

  const onSubmit = async (data: EventFormData) => {
    try {
      if (isEditMode) {
        await updateEvent({ id: event.id, event: data }).unwrap();
      } else {
        await createEvent(data).unwrap();
      }
      onSuccess();
    } catch (error) {
      console.error('행사 저장 실패:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 행사명 */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          행사명 <span className="text-destructive">*</span>
        </label>
        <Input
          id="name"
          {...register('name')}
          placeholder="행사명을 입력하세요"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* 행사 기간 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="startDate" className="text-sm font-medium">
            시작일 <span className="text-destructive">*</span>
          </label>
          <Input
            id="startDate"
            type="date"
            {...register('startDate')}
            className={errors.startDate ? 'border-destructive' : ''}
          />
          {errors.startDate && (
            <p className="text-sm text-destructive">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="endDate" className="text-sm font-medium">
            종료일 <span className="text-destructive">*</span>
          </label>
          <Input
            id="endDate"
            type="date"
            {...register('endDate')}
            className={errors.endDate ? 'border-destructive' : ''}
          />
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* 장소 */}
      <div className="space-y-2">
        <label htmlFor="location" className="text-sm font-medium">
          장소
        </label>
        <Input
          id="location"
          {...register('location')}
          placeholder="행사 장소 (선택사항)"
        />
      </div>

      {/* 배정 예산 */}
      <div className="space-y-2">
        <label htmlFor="allocatedBudget" className="text-sm font-medium">
          배정 예산
        </label>
        <Input
          id="allocatedBudget"
          type="number"
          {...register('allocatedBudget', { valueAsNumber: true })}
          placeholder="예산을 입력하세요 (선택사항)"
          className={errors.allocatedBudget ? 'border-destructive' : ''}
        />
        {errors.allocatedBudget && (
          <p className="text-sm text-destructive">
            {errors.allocatedBudget.message}
          </p>
        )}
      </div>

      {/* 소속 단체 */}
      <div className="space-y-2">
        <label htmlFor="organizationId" className="text-sm font-medium">
          소속 단체 <span className="text-destructive">*</span>
        </label>
        <Select
          value={selectedOrg}
          onValueChange={(value) => setValue('organizationId', value)}
          disabled={isLoadingOrgs}
        >
          <SelectTrigger
            className={errors.organizationId ? 'border-destructive' : ''}
          >
            <SelectValue placeholder="단체를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {organizations?.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.organizationId && (
          <p className="text-sm text-destructive">
            {errors.organizationId.message}
          </p>
        )}
      </div>

      {/* 행사 설명 */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          행사 설명
        </label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="행사에 대한 설명을 입력하세요 (선택사항)"
          rows={4}
        />
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? '저장 중...'
            : isEditMode
              ? '수정하기'
              : '생성하기'}
        </Button>
      </div>
    </form>
  );
};
