import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetEventsQuery, useDeleteEventMutation } from '@/store/api/eventsApi';
import { EventCard } from '@/components/events/EventCard';
import { EventFilters } from '@/components/events/EventFilters';
import { EventModal } from '@/components/events/EventModal';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';
import { EventStatus } from '@/types';
import { Skeleton } from '@/components/common/Loading';

export const EventListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: events, isLoading, error } = useGetEventsQuery();
  const [deleteEvent] = useDeleteEventMutation();

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'startDate' | 'name' | 'createdAt'>('startDate');

  // 필터링 및 정렬 로직
  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];

    let result = [...events];

    // 검색 필터
    if (searchQuery) {
      result = result.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'ALL') {
      result = result.filter((event) => event.status === statusFilter);
    }

    // 정렬
    result.sort((a, b) => {
      switch (sortBy) {
        case 'startDate':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'name':
          return a.title.localeCompare(b.title, 'ko');
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [events, searchQuery, statusFilter, sortBy]);

  // 행사 액션 핸들러
  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (event: Event) => {
    if (confirm(`"${event.title}" 행사를 삭제하시겠습니까?`)) {
      try {
        await deleteEvent(event.id).unwrap();
      } catch (error) {
        console.error('행사 삭제 실패:', error);
      }
    }
  };

  const handleCreateBudget = (event: Event) => {
    navigate(`/events/${event.id}/budget`);
  };

  const handleCreateSettlement = (event: Event) => {
    navigate(`/events/${event.id}/settlement`);
  };

  const handleCreateEvent = () => {
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEvent(undefined);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">행사 관리</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">행사 목록을 불러오는데 실패했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">행사 관리</h1>
        <Button onClick={handleCreateEvent}>새 행사 생성</Button>
      </div>

      {/* 필터 */}
      <EventFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* 행사 목록 */}
      {filteredAndSortedEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'ALL'
              ? '검색 결과가 없습니다.'
              : '등록된 행사가 없습니다. 새 행사를 생성해주세요.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateBudget={handleCreateBudget}
              onCreateSettlement={handleCreateSettlement}
            />
          ))}
        </div>
      )}

      {/* 행사 생성/편집 모달 */}
      <EventModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        event={editingEvent}
      />
    </div>
  );
};
