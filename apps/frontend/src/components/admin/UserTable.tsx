import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Search,
  UserCheck,
  UserX,
  UserCog,
  Trash2,
  Shield,
} from 'lucide-react';
import { AdminUser, useUpdateUserStatusMutation, useDeleteUserMutation } from '@/store/api/adminApi';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface UserTableProps {
  users: AdminUser[];
  onEditUser: (user: AdminUser) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onEditUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [updateStatus] = useUpdateUserStatusMutation();
  const [deleteUser] = useDeleteUserMutation();

  const getRoleBadge = (role: AdminUser['role']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      SUPER_ADMIN: 'destructive',
      ADMIN: 'default',
      MANAGER: 'secondary',
      USER: 'secondary',
      QA: 'secondary',
    };

    const labels: Record<string, string> = {
      SUPER_ADMIN: '최고관리자',
      ADMIN: '관리자',
      MANAGER: '매니저',
      USER: '사용자',
      QA: 'QA',
    };

    return (
      <Badge variant={variants[role]}>
        {labels[role]}
      </Badge>
    );
  };

  const getStatusBadge = (status: AdminUser['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      SUSPENDED: 'destructive',
    };

    const labels: Record<string, string> = {
      ACTIVE: '활성',
      INACTIVE: '비활성',
      SUSPENDED: '정지',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleStatusChange = async (
    userId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  ) => {
    try {
      await updateStatus({ id: userId, status }).unwrap();
      alert('사용자 상태가 변경되었습니다.');
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`${userName} 사용자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteUser(userId).unwrap();
      alert('사용자가 삭제되었습니다.');
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      alert('사용자 삭제에 실패했습니다.');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* 필터 및 검색 */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="이름 또는 이메일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="역할 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 역할</SelectItem>
            <SelectItem value="SUPER_ADMIN">최고관리자</SelectItem>
            <SelectItem value="ADMIN">관리자</SelectItem>
            <SelectItem value="MANAGER">매니저</SelectItem>
            <SelectItem value="USER">사용자</SelectItem>
            <SelectItem value="QA">QA</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="ACTIVE">활성</SelectItem>
            <SelectItem value="INACTIVE">비활성</SelectItem>
            <SelectItem value="SUSPENDED">정지</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사용자</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>단체</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead>마지막 로그인</TableHead>
              <TableHead className="text-center">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    {user.organizationName || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), 'yyyy-MM-dd', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? (
                      format(new Date(user.lastLoginAt), 'yyyy-MM-dd HH:mm', {
                        locale: ko,
                      })
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>작업</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                          <UserCog className="w-4 h-4 mr-2" />
                          정보 수정
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                          disabled={user.status === 'ACTIVE'}
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          활성화
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(user.id, 'INACTIVE')}
                          disabled={user.status === 'INACTIVE'}
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          비활성화
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                          disabled={user.status === 'SUSPENDED'}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          정지
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(user.id, user.name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 통계 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>총 {filteredUsers.length}명의 사용자</p>
        <p>
          활성: {filteredUsers.filter((u) => u.status === 'ACTIVE').length} / 비활성:{' '}
          {filteredUsers.filter((u) => u.status === 'INACTIVE').length} / 정지:{' '}
          {filteredUsers.filter((u) => u.status === 'SUSPENDED').length}
        </p>
      </div>
    </div>
  );
};
