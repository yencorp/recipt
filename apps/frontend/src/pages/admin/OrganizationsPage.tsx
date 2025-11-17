import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { OrganizationCard } from '@/components/admin/OrganizationCard';
import { OrganizationEditModal } from '@/components/admin/OrganizationEditModal';
import {
  useGetOrganizationsQuery,
  useDeleteOrganizationMutation,
} from '@/store/api/organizationsApi';

interface Organization {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  eventCount?: number;
  createdAt: string;
  isActive?: boolean;
}

export const OrganizationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: organizations = [], isLoading, error, refetch } =
    useGetOrganizationsQuery();
  const [deleteOrganization] = useDeleteOrganizationMutation();

  const handleEdit = (org: Organization) => {
    setSelectedOrganization(org);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedOrganization(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (org: Organization) => {
    if (!confirm(`${org.name} 단체를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteOrganization(org.id).unwrap();
      alert('단체가 삭제되었습니다.');
      refetch();
    } catch (error) {
      console.error('단체 삭제 실패:', error);
      alert('단체 삭제에 실패했습니다.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrganization(null);
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <p className="font-medium">단체 목록을 불러올 수 없습니다.</p>
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
          <h1 className="text-3xl font-bold">단체 관리</h1>
          <p className="text-muted-foreground mt-1">
            단체 정보를 관리하고 구성원을 조직합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            단체 추가
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 단체
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{organizations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              활성 단체
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {organizations.filter((o) => o.isActive !== false).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 구성원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {organizations.reduce(
                (sum, org) => sum + (org.memberCount || 0),
                0
              )}
              명
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 행사
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {organizations.reduce((sum, org) => sum + (org.eventCount || 0), 0)}
              개
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="단체명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* 단체 목록 */}
      {filteredOrganizations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="font-medium">단체가 없습니다.</p>
              <Button variant="outline" onClick={handleCreate} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                첫 단체 추가하기
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrganizations.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 단체 추가/수정 모달 */}
      <OrganizationEditModal
        organization={selectedOrganization}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
