import { EventStatus } from '@/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export interface EventFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: EventStatus | 'ALL';
  onStatusChange: (status: EventStatus | 'ALL') => void;
  sortBy: 'startDate' | 'name' | 'createdAt';
  onSortChange: (sortBy: 'startDate' | 'name' | 'createdAt') => void;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
}) => {
  const statusOptions = [
    { value: 'ALL', label: '전체' },
    { value: EventStatus.PLANNING, label: '준비중' },
    { value: EventStatus.IN_PROGRESS, label: '진행중' },
    { value: EventStatus.COMPLETED, label: '완료' },
  ];

  const sortOptions = [
    { value: 'startDate', label: '시작일순' },
    { value: 'name', label: '이름순' },
    { value: 'createdAt', label: '생성일순' },
  ];

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input
          type="text"
          placeholder="행사명 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="정렬 기준" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};
