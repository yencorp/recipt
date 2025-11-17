import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Download, RefreshCw } from 'lucide-react';
import { UserTable } from '@/components/admin/UserTable';
import { UserEditModal } from '@/components/admin/UserEditModal';
import { AdminUser, useGetAllUsersQuery } from '@/store/api/adminApi';

export const UsersPage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { data: users = [], isLoading, error, refetch } = useGetAllUsersQuery({});

  const handleExport = () => {
    // CSV 내보내기
    const csvData = [
      ['이름', '이메일', '역할', '상태', '단체', '가입일', '마지막 로그인'],
      ...users.map((user) => [
        user.name,
        user.email,
        user.role,
        user.status,
        user.organizationName || '',
        user.createdAt,
        user.lastLoginAt || '',
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-destructive">
            <p className="font-medium">사용자 목록을 불러올 수 없습니다.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">사용자 관리</h1>
          <p className="text-muted-foreground mt-1">
            시스템 사용자를 관리하고 권한을 설정합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              활성 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.status === 'ACTIVE').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              관리자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {
                users.filter(
                  (u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN'
                ).length
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              정지된 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.status === 'SUSPENDED').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 사용자 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable users={users} onEditUser={setSelectedUser} />
        </CardContent>
      </Card>

      {/* 사용자 편집 모달 */}
      <UserEditModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
