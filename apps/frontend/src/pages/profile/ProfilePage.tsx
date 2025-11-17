import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { PasswordChangeModal } from '@/components/profile/PasswordChangeModal';
import { Button } from '@/components/common/Form';
import { Spinner } from '@/components/common/Loading';

export const ProfilePage: React.FC = () => {
  const { user, loading } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-sm rounded-lg">
        {/* 헤더 */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">프로필 관리</h1>
              <p className="mt-1 text-sm text-gray-600">
                개인정보를 관리하고 비밀번호를 변경할 수 있습니다
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              비밀번호 변경
            </Button>
          </div>
        </div>

        {/* 사용자 정보 요약 */}
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">이메일</p>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">권한</p>
              <p className="mt-1 text-sm text-gray-900">
                {user.role === 'ADMIN'
                  ? '시스템 관리자'
                  : user.role === 'ORG_ADMIN'
                    ? '조직 관리자'
                    : user.role === 'MEMBER'
                      ? '일반 회원'
                      : user.role === 'USER'
                        ? '사용자'
                        : 'QA'}
              </p>
            </div>
          </div>
        </div>

        {/* 소속 단체 정보 */}
        {user.organizations && user.organizations.length > 0 && (
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              소속 단체
            </h2>
            <div className="space-y-3">
              {user.organizations.map((org) => (
                <div
                  key={org.organizationId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {org.organization.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      역할: {org.role === 'ADMIN' ? '관리자' : '멤버'} | 가입일:{' '}
                      {new Date(org.joinedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  {org.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      활성
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      비활성
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 프로필 수정 폼 */}
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            개인정보 수정
          </h2>
          <ProfileForm user={user} />
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
