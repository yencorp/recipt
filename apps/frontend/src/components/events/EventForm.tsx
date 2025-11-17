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
import { EventType } from '@/types';

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
          organizationId: event.organization.id,
          title: event.title,
          description: event.description || '',
          type: event.type,
          startDate: event.startDate.split('T')[0],
          endDate: event.endDate.split('T')[0],
          location: event.location || '',
          estimatedCost: event.estimatedCost || undefined,
        }
      : {
          organizationId: '',
          title: '',
          description: '',
          type: EventType.OTHER,
          startDate: '',
          endDate: '',
          location: '',
          estimatedCost: undefined,
        },
  });

  const selectedOrg = watch('organizationId');
  const selectedType = watch('type');

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

      {/* 행사명 */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          행사명 <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          {...register('title')}
          placeholder="행사명을 입력하세요"
          className={errors.title ? 'border-destructive' : ''}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* 행사 유형 */}
      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          행사 유형 <span className="text-destructive">*</span>
        </label>
        <Select
          value={selectedType}
          onValueChange={(value) => setValue('type', value as EventType)}
        >
          <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
            <SelectValue placeholder="행사 유형을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EventType.RETREAT}>수련회</SelectItem>
            <SelectItem value={EventType.WORKSHOP}>워크샵</SelectItem>
            <SelectItem value={EventType.MEETING}>회의</SelectItem>
            <SelectItem value={EventType.SOCIAL}>친교</SelectItem>
            <SelectItem value={EventType.EDUCATION}>교육</SelectItem>
            <SelectItem value={EventType.SERVICE}>봉사</SelectItem>
            <SelectItem value={EventType.OTHER}>기타</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
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

      {/* 예상 비용 */}
      <div className="space-y-2">
        <label htmlFor="estimatedCost" className="text-sm font-medium">
          예상 비용
        </label>
        <Input
          id="estimatedCost"
          type="number"
          {...register('estimatedCost', { valueAsNumber: true })}
          placeholder="예상 비용을 입력하세요 (선택사항)"
          className={errors.estimatedCost ? 'border-destructive' : ''}
        />
        {errors.estimatedCost && (
          <p className="text-sm text-destructive">
            {errors.estimatedCost.message}
          </p>
        )}
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
