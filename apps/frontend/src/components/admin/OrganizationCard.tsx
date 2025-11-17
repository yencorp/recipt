import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Users,
  Calendar,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  eventCount?: number;
  createdAt: string;
  isActive?: boolean;
}

interface OrganizationCardProps {
  organization: Organization;
  onEdit: (org: Organization) => void;
  onDelete: (org: Organization) => void;
  onViewMembers?: (org: Organization) => void;
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({
  organization,
  onEdit,
  onDelete,
  onViewMembers,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{organization.name}</CardTitle>
              {organization.isActive !== undefined && (
                <Badge variant={organization.isActive ? 'default' : 'secondary'} className="mt-1">
                  {organization.isActive ? '활성' : '비활성'}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>작업</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(organization)}>
                <Edit className="w-4 h-4 mr-2" />
                수정
              </DropdownMenuItem>
              {onViewMembers && (
                <DropdownMenuItem onClick={() => onViewMembers(organization)}>
                  <Users className="w-4 h-4 mr-2" />
                  구성원 보기
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(organization)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {organization.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {organization.description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">구성원</p>
              <p className="text-sm font-semibold">
                {organization.memberCount || 0}명
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">행사</p>
              <p className="text-sm font-semibold">
                {organization.eventCount || 0}개
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">생성일</p>
              <p className="text-sm font-semibold">
                {new Date(organization.createdAt).toLocaleDateString('ko-KR', {
                  year: '2-digit',
                  month: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(organization)} className="flex-1">
            <Edit className="w-3 h-3 mr-1" />
            수정
          </Button>
          {onViewMembers && (
            <Button variant="outline" size="sm" onClick={() => onViewMembers(organization)} className="flex-1">
              <Users className="w-3 h-3 mr-1" />
              구성원
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
