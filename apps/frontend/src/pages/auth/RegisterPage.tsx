import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { registerSchema, type RegisterFormData } from '@/schemas/authSchema';
import { useRegisterMutation } from '@/store/api/authApi';
import { useState } from 'react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [apiError, setApiError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setApiError('');
      setSuccessMessage('');

      // 백엔드 API 형식에 맞게 데이터 변환
      const { confirmPassword, baptismalName, position, ...rest } = data;
      const registerData = {
        ...rest,
        passwordConfirm: confirmPassword, // 백엔드는 passwordConfirm을 기대함
      };

      await registerUser(registerData).unwrap();

      setSuccessMessage('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setApiError(
        err?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            광남동성당 청소년위원회 예결산 관리 시스템
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일 *
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="이메일을 입력하세요"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호 *
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="new-password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="비밀번호를 입력하세요"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                비밀번호 확인 *
              </label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="비밀번호를 다시 입력하세요"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름 *
              </label>
              <input
                {...register('name')}
                id="name"
                type="text"
                autoComplete="name"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="이름을 입력하세요"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="baptismalName" className="block text-sm font-medium text-gray-700">
                세례명
              </label>
              <input
                {...register('baptismalName')}
                id="baptismalName"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="세례명을 입력하세요 (선택사항)"
              />
              {errors.baptismalName && (
                <p className="mt-1 text-sm text-red-600">{errors.baptismalName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                연락처 *
              </label>
              <input
                {...register('phone')}
                id="phone"
                type="tel"
                autoComplete="tel"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="010-1234-5678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                직책 *
              </label>
              <input
                {...register('position')}
                id="position"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="예: 회장, 총무, 회계, 일반회원 등"
              />
              {errors.position && (
                <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '회원가입 중...' : '회원가입'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
