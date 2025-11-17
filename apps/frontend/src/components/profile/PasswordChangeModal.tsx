import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordChangeSchema, type PasswordChangeData } from '@/schemas/profileSchema';
import { useChangePasswordMutation } from '@/store/api/userApi';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Form';
import { Button } from '@/components/common/Form';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [apiError, setApiError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordChangeData>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = async (data: PasswordChangeData) => {
    try {
      setApiError('');
      setSuccessMessage('');

      await changePassword(data).unwrap();

      setSuccessMessage('비밀번호가 성공적으로 변경되었습니다.');
      setTimeout(() => {
        reset();
        onClose();
        setSuccessMessage('');
      }, 2000);
    } catch (err: any) {
      setApiError(
        err?.data?.message || '비밀번호 변경에 실패했습니다. 다시 시도해주세요.'
      );
    }
  };

  const handleClose = () => {
    reset();
    setApiError('');
    setSuccessMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="비밀번호 변경"
      size="md"
      footer={
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            isLoading={isLoading}
          >
            변경
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <Input
          {...register('currentPassword')}
          id="currentPassword"
          type="password"
          label="현재 비밀번호"
          error={errors.currentPassword?.message}
          placeholder="현재 비밀번호를 입력하세요"
          required
        />

        <Input
          {...register('newPassword')}
          id="newPassword"
          type="password"
          label="새 비밀번호"
          error={errors.newPassword?.message}
          placeholder="새 비밀번호를 입력하세요"
          helperText="대문자, 소문자, 숫자를 포함하여 최소 6자"
          required
        />

        <Input
          {...register('confirmPassword')}
          id="confirmPassword"
          type="password"
          label="비밀번호 확인"
          error={errors.confirmPassword?.message}
          placeholder="새 비밀번호를 다시 입력하세요"
          required
        />
      </form>
    </Modal>
  );
};
