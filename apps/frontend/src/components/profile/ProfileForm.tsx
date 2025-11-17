import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { profileUpdateSchema, type ProfileUpdateData } from '@/schemas/profileSchema';
import { useUpdateProfileMutation } from '@/store/api/userApi';
import { setCredentials } from '@/store/slices/authSlice';
import { Input } from '@/components/common/Form';
import { Button } from '@/components/common/Form';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types';

interface ProfileFormProps {
  user: User;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user }) => {
  const dispatch = useDispatch();
  const { accessToken, refreshToken } = useAuth();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [apiError, setApiError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user.name,
      baptismalName: user.baptismalName || '',
      phone: user.phone,
      position: user.position,
    },
  });

  // user 정보 변경 시 폼 리셋
  useEffect(() => {
    reset({
      name: user.name,
      baptismalName: user.baptismalName || '',
      phone: user.phone,
      position: user.position,
    });
  }, [user, reset]);

  const onSubmit = async (data: ProfileUpdateData) => {
    try {
      setApiError('');
      setSuccessMessage('');

      const updatedUser = await updateProfile(data).unwrap();

      // Redux 상태 업데이트
      dispatch(
        setCredentials({
          user: updatedUser,
          accessToken: accessToken!,
          refreshToken: refreshToken!,
        })
      );

      setSuccessMessage('프로필이 성공적으로 수정되었습니다.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setApiError(
        err?.data?.message || '프로필 수정에 실패했습니다. 다시 시도해주세요.'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {apiError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{apiError}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Input
          {...register('name')}
          id="name"
          type="text"
          label="이름"
          error={errors.name?.message}
          placeholder="이름을 입력하세요"
          required
        />

        <Input
          {...register('baptismalName')}
          id="baptismalName"
          type="text"
          label="세례명"
          error={errors.baptismalName?.message}
          placeholder="세례명을 입력하세요 (선택사항)"
        />

        <Input
          {...register('phone')}
          id="phone"
          type="tel"
          label="연락처"
          error={errors.phone?.message}
          placeholder="010-1234-5678"
          required
        />

        <Input
          {...register('position')}
          id="position"
          type="text"
          label="직책"
          error={errors.position?.message}
          placeholder="예: 회장, 총무, 회계, 일반회원 등"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={!isDirty || isLoading}
        >
          취소
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={!isDirty}
        >
          저장
        </Button>
      </div>
    </form>
  );
};
