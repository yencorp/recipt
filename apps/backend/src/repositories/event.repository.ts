import { Injectable } from "@nestjs/common";
import { DataSource, SelectQueryBuilder } from "typeorm";
import {
  BaseRepository,
  PaginationOptions,
  PaginationResult,
} from "./base.repository";
import {
  Event,
  EventStatus,
  EventType,
  EventVisibility,
} from "../entities/event.entity";

/**
 * 행사 검색 옵션
 */
export interface EventSearchOptions {
  query?: string;
  organizationId?: string;
  status?: EventStatus | EventStatus[];
  type?: EventType | EventType[];
  visibility?: EventVisibility;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  createdBy?: string;
  approvedBy?: string;
  isUpcoming?: boolean;
  isOngoing?: boolean;
  isPast?: boolean;
  isCancelled?: boolean;
  hasAvailableSlots?: boolean;
  tags?: string[];
}

/**
 * 행사 통계 결과
 */
export interface EventStatistics {
  total: number;
  byStatus: Record<EventStatus, number>;
  byType: Record<EventType, number>;
  byVisibility: Record<EventVisibility, number>;
  upcoming: number;
  ongoing: number;
  past: number;
  cancelled: number;
  totalParticipants: number;
  averageParticipants: number;
  fullyBookedEvents: number;
  recentEvents: number; // 지난 30일 내 생성된 행사
}

/**
 * 참가자 통계
 */
export interface ParticipantStatistics {
  totalRegistrations: number;
  averagePerEvent: number;
  peakRegistration: {
    eventId: string;
    eventTitle: string;
    participants: number;
  };
  registrationTrend: Array<{
    date: string;
    registrations: number;
    eventsCount: number;
  }>;
}

/**
 * 행사 달력 데이터
 */
export interface EventCalendarItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: EventType;
  status: EventStatus;
  location?: string;
  participantCount: number;
  maxParticipants?: number;
}

/**
 * Event Repository 클래스
 * 행사 엔티티에 특화된 복잡한 쿼리와 비즈니스 로직을 처리
 */
@Injectable()
export class EventRepository extends BaseRepository<Event> {
  constructor(dataSource: DataSource) {
    super(dataSource, Event);
  }

  /**
   * 조직의 행사 목록 조회
   * @param organizationId 조직 ID
   * @param paginationOptions 페이징 옵션
   * @returns 페이징된 행사 목록
   */
  async findByOrganization(
    organizationId: string,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<Event>> {
    try {
      const queryBuilder = this.createQueryBuilder("event")
        .leftJoinAndSelect("event.organization", "org")
        .where("event.organizationId = :organizationId", { organizationId })
        .orderBy("event.startDate", "DESC");

      return await this.executePagedQuery(queryBuilder, paginationOptions);
    } catch (error) {
      throw new Error(
        `Failed to find events by organization: ${error.message}`
      );
    }
  }

  /**
   * 고급 행사 검색
   * @param searchOptions 검색 옵션
   * @param paginationOptions 페이징 옵션
   * @returns 페이징된 검색 결과
   */
  async searchEvents(
    searchOptions: EventSearchOptions,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<Event>> {
    try {
      const queryBuilder = this.createQueryBuilder("event").leftJoinAndSelect(
        "event.organization",
        "org"
      );

      // 텍스트 검색 (제목, 설명, 장소)
      if (searchOptions.query) {
        const searchTerm = `%${searchOptions.query}%`;
        queryBuilder.andWhere(
          "(event.title ILIKE :searchTerm OR event.description ILIKE :searchTerm OR event.location ILIKE :searchTerm)",
          { searchTerm }
        );
      }

      // 조직 필터
      if (searchOptions.organizationId) {
        queryBuilder.andWhere("event.organizationId = :organizationId", {
          organizationId: searchOptions.organizationId,
        });
      }

      // 상태 필터
      if (searchOptions.status) {
        if (Array.isArray(searchOptions.status)) {
          queryBuilder.andWhere("event.status IN (:...statuses)", {
            statuses: searchOptions.status,
          });
        } else {
          queryBuilder.andWhere("event.status = :status", {
            status: searchOptions.status,
          });
        }
      }

      // 유형 필터
      if (searchOptions.type) {
        if (Array.isArray(searchOptions.type)) {
          queryBuilder.andWhere("event.type IN (:...types)", {
            types: searchOptions.type,
          });
        } else {
          queryBuilder.andWhere("event.type = :type", {
            type: searchOptions.type,
          });
        }
      }

      // 공개 설정 필터
      if (searchOptions.visibility) {
        queryBuilder.andWhere("event.visibility = :visibility", {
          visibility: searchOptions.visibility,
        });
      }

      // 날짜 범위 필터
      if (searchOptions.startDate && searchOptions.endDate) {
        queryBuilder.andWhere(
          "(event.startDate <= :endDate AND event.endDate >= :startDate)",
          {
            startDate: searchOptions.startDate,
            endDate: searchOptions.endDate,
          }
        );
      } else if (searchOptions.startDate) {
        queryBuilder.andWhere("event.endDate >= :startDate", {
          startDate: searchOptions.startDate,
        });
      } else if (searchOptions.endDate) {
        queryBuilder.andWhere("event.startDate <= :endDate", {
          endDate: searchOptions.endDate,
        });
      }

      // 장소 필터
      if (searchOptions.location) {
        queryBuilder.andWhere("event.location ILIKE :location", {
          location: `%${searchOptions.location}%`,
        });
      }

      // 생성자 필터
      if (searchOptions.createdBy) {
        queryBuilder.andWhere("event.createdBy = :createdBy", {
          createdBy: searchOptions.createdBy,
        });
      }

      // 승인자 필터
      if (searchOptions.approvedBy) {
        queryBuilder.andWhere("event.approvedBy = :approvedBy", {
          approvedBy: searchOptions.approvedBy,
        });
      }

      // 시간적 상태 필터
      const now = new Date();
      if (searchOptions.isUpcoming === true) {
        queryBuilder.andWhere("event.startDate > :now", { now });
      } else if (searchOptions.isUpcoming === false) {
        queryBuilder.andWhere("event.startDate <= :now", { now });
      }

      if (searchOptions.isOngoing === true) {
        queryBuilder.andWhere(
          "event.startDate <= :now AND event.endDate >= :now",
          { now }
        );
      }

      if (searchOptions.isPast === true) {
        queryBuilder.andWhere("event.endDate < :now", { now });
      } else if (searchOptions.isPast === false) {
        queryBuilder.andWhere("event.endDate >= :now", { now });
      }

      // 취소 상태 필터
      if (searchOptions.isCancelled !== undefined) {
        queryBuilder.andWhere("event.isCancelled = :isCancelled", {
          isCancelled: searchOptions.isCancelled,
        });
      }

      // 예약 가능 여부 필터
      if (searchOptions.hasAvailableSlots === true) {
        queryBuilder.andWhere(
          "(event.maxParticipants IS NULL OR event.currentParticipants < event.maxParticipants)"
        );
      } else if (searchOptions.hasAvailableSlots === false) {
        queryBuilder.andWhere(
          "event.maxParticipants IS NOT NULL AND event.currentParticipants >= event.maxParticipants"
        );
      }

      // 태그 필터
      if (searchOptions.tags && searchOptions.tags.length > 0) {
        queryBuilder.andWhere("event.metadata->'tags' ?| ARRAY[:...tags]", {
          tags: searchOptions.tags,
        });
      }

      queryBuilder.orderBy("event.startDate", "DESC");

      return await this.executePagedQuery(queryBuilder, paginationOptions);
    } catch (error) {
      throw new Error(`Failed to search events: ${error.message}`);
    }
  }

  /**
   * 날짜 범위로 행사 조회 (달력용)
   * @param startDate 시작일
   * @param endDate 종료일
   * @param organizationId 조직 ID (선택사항)
   * @returns 행사 달력 데이터
   */
  async findForCalendar(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<EventCalendarItem[]> {
    try {
      const queryBuilder = this.createQueryBuilder("event")
        .select([
          "event.id",
          "event.title",
          "event.startDate",
          "event.endDate",
          "event.type",
          "event.status",
          "event.location",
          "event.currentParticipants",
          "event.maxParticipants",
        ])
        .where(
          "(event.startDate <= :endDate AND event.endDate >= :startDate)",
          { startDate, endDate }
        )
        .andWhere("event.isCancelled = :isCancelled", { isCancelled: false });

      if (organizationId) {
        queryBuilder.andWhere("event.organizationId = :organizationId", {
          organizationId,
        });
      }

      const events = await queryBuilder
        .orderBy("event.startDate", "ASC")
        .getMany();

      return events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        type: event.type,
        status: event.status,
        location: event.location,
        participantCount: event.currentParticipants,
        maxParticipants: event.maxParticipants,
      }));
    } catch (error) {
      throw new Error(`Failed to find events for calendar: ${error.message}`);
    }
  }

  /**
   * 행사 통계 조회
   * @param organizationId 조직 ID (선택사항)
   * @returns 행사 통계
   */
  async getEventStatistics(organizationId?: string): Promise<EventStatistics> {
    try {
      const queryBuilder = this.createQueryBuilder("event");

      if (organizationId) {
        queryBuilder.where("event.organizationId = :organizationId", {
          organizationId,
        });
      }

      const events = await queryBuilder.getMany();

      const stats: EventStatistics = {
        total: events.length,
        byStatus: {
          [EventStatus.DRAFT]: 0,
          [EventStatus.PLANNED]: 0,
          [EventStatus.APPROVED]: 0,
          [EventStatus.IN_PROGRESS]: 0,
          [EventStatus.COMPLETED]: 0,
          [EventStatus.CANCELLED]: 0,
          [EventStatus.POSTPONED]: 0,
        },
        byType: {
          [EventType.REGULAR]: 0,
          [EventType.SPECIAL]: 0,
          [EventType.FUNDRAISING]: 0,
          [EventType.WORSHIP]: 0,
          [EventType.FELLOWSHIP]: 0,
          [EventType.EDUCATION]: 0,
          [EventType.OUTREACH]: 0,
          [EventType.SERVICE]: 0,
          [EventType.RETREAT]: 0,
          [EventType.CONFERENCE]: 0,
          [EventType.OTHER]: 0,
        },
        byVisibility: {
          [EventVisibility.PUBLIC]: 0,
          [EventVisibility.PRIVATE]: 0,
          [EventVisibility.MEMBERS_ONLY]: 0,
        },
        upcoming: 0,
        ongoing: 0,
        past: 0,
        cancelled: 0,
        totalParticipants: 0,
        averageParticipants: 0,
        fullyBookedEvents: 0,
        recentEvents: 0,
      };

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      events.forEach((event) => {
        // 상태별 집계
        stats.byStatus[event.status]++;

        // 유형별 집계
        stats.byType[event.type]++;

        // 공개 설정별 집계
        stats.byVisibility[event.visibility]++;

        // 시간적 상태
        if (event.isUpcoming) stats.upcoming++;
        if (event.isOngoing) stats.ongoing++;
        if (event.isPast) stats.past++;

        // 취소 상태
        if (event.isCancelled) stats.cancelled++;

        // 참가자 통계
        stats.totalParticipants += event.currentParticipants;

        // 완전 예약 이벤트
        if (event.isFullyBooked) stats.fullyBookedEvents++;

        // 최근 생성된 이벤트
        if (event.createdAt > thirtyDaysAgo) stats.recentEvents++;
      });

      // 평균 참가자 수 계산
      stats.averageParticipants =
        stats.total > 0
          ? Math.round((stats.totalParticipants / stats.total) * 100) / 100
          : 0;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get event statistics: ${error.message}`);
    }
  }

  /**
   * 참가자 통계 조회
   * @param days 조회할 일수 (기본: 30일)
   * @param organizationId 조직 ID (선택사항)
   * @returns 참가자 통계
   */
  async getParticipantStatistics(
    days = 30,
    organizationId?: string
  ): Promise<ParticipantStatistics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const queryBuilder = this.createQueryBuilder("event")
        .where("event.createdAt >= :startDate", { startDate })
        .andWhere("event.isCancelled = :isCancelled", { isCancelled: false });

      if (organizationId) {
        queryBuilder.andWhere("event.organizationId = :organizationId", {
          organizationId,
        });
      }

      const events = await queryBuilder.getMany();

      const totalRegistrations = events.reduce(
        (sum, event) => sum + event.currentParticipants,
        0
      );

      const averagePerEvent =
        events.length > 0
          ? Math.round((totalRegistrations / events.length) * 100) / 100
          : 0;

      // 최대 참가자 수 이벤트 찾기
      const peakEvent = events.reduce(
        (max, event) =>
          event.currentParticipants > max.participants
            ? {
                eventId: event.id,
                eventTitle: event.title,
                participants: event.currentParticipants,
              }
            : max,
        { eventId: "", eventTitle: "", participants: 0 }
      );

      // 일별 등록 추세 계산 (간단화된 버전)
      const registrationTrend = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split("T")[0];

        const dayEvents = events.filter((event) => {
          const eventDate = new Date(event.createdAt);
          return eventDate.toISOString().split("T")[0] === dateString;
        });

        const dayRegistrations = dayEvents.reduce(
          (sum, event) => sum + event.currentParticipants,
          0
        );

        registrationTrend.push({
          date: dateString,
          registrations: dayRegistrations,
          eventsCount: dayEvents.length,
        });
      }

      return {
        totalRegistrations,
        averagePerEvent,
        peakRegistration: peakEvent,
        registrationTrend,
      };
    } catch (error) {
      throw new Error(`Failed to get participant statistics: ${error.message}`);
    }
  }

  /**
   * 곧 시작할 행사 조회
   * @param days 앞으로 며칠 내 행사 (기본: 7일)
   * @param organizationId 조직 ID (선택사항)
   * @returns 곧 시작할 행사 목록
   */
  async findUpcomingEvents(
    days = 7,
    organizationId?: string
  ): Promise<Event[]> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const queryBuilder = this.createQueryBuilder("event")
        .leftJoinAndSelect("event.organization", "org")
        .where("event.startDate BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        })
        .andWhere("event.status IN (:...statuses)", {
          statuses: [EventStatus.APPROVED, EventStatus.PLANNED],
        })
        .andWhere("event.isCancelled = :isCancelled", { isCancelled: false });

      if (organizationId) {
        queryBuilder.andWhere("event.organizationId = :organizationId", {
          organizationId,
        });
      }

      return await queryBuilder.orderBy("event.startDate", "ASC").getMany();
    } catch (error) {
      throw new Error(`Failed to find upcoming events: ${error.message}`);
    }
  }

  /**
   * 진행 중인 행사 조회
   * @param organizationId 조직 ID (선택사항)
   * @returns 진행 중인 행사 목록
   */
  async findOngoingEvents(organizationId?: string): Promise<Event[]> {
    try {
      const now = new Date();
      const queryBuilder = this.createQueryBuilder("event")
        .leftJoinAndSelect("event.organization", "org")
        .where("event.startDate <= :now AND event.endDate >= :now", { now })
        .andWhere("event.status = :status", { status: EventStatus.IN_PROGRESS })
        .andWhere("event.isCancelled = :isCancelled", { isCancelled: false });

      if (organizationId) {
        queryBuilder.andWhere("event.organizationId = :organizationId", {
          organizationId,
        });
      }

      return await queryBuilder.orderBy("event.startDate", "ASC").getMany();
    } catch (error) {
      throw new Error(`Failed to find ongoing events: ${error.message}`);
    }
  }

  /**
   * 등록 가능한 행사 조회
   * @param organizationId 조직 ID (선택사항)
   * @param paginationOptions 페이징 옵션
   * @returns 등록 가능한 행사 목록
   */
  async findRegistrableEvents(
    organizationId?: string,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<Event>> {
    try {
      const now = new Date();
      const queryBuilder = this.createQueryBuilder("event")
        .leftJoinAndSelect("event.organization", "org")
        .where("event.status = :status", { status: EventStatus.APPROVED })
        .andWhere("event.isCancelled = :isCancelled", { isCancelled: false })
        .andWhere("event.startDate > :now", { now })
        .andWhere("event.visibility != :privateVisibility", {
          privateVisibility: EventVisibility.PRIVATE,
        })
        .andWhere(
          "(event.maxParticipants IS NULL OR event.currentParticipants < event.maxParticipants)"
        );

      if (organizationId) {
        queryBuilder.andWhere("event.organizationId = :organizationId", {
          organizationId,
        });
      }

      queryBuilder.orderBy("event.startDate", "ASC");

      return await this.executePagedQuery(queryBuilder, paginationOptions);
    } catch (error) {
      throw new Error(`Failed to find registrable events: ${error.message}`);
    }
  }

  /**
   * 태그별 행사 조회
   * @param tags 태그 목록
   * @param organizationId 조직 ID (선택사항)
   * @returns 태그가 포함된 행사 목록
   */
  async findByTags(tags: string[], organizationId?: string): Promise<Event[]> {
    try {
      const queryBuilder = this.createQueryBuilder("event")
        .leftJoinAndSelect("event.organization", "org")
        .where("event.metadata->'tags' ?| ARRAY[:...tags]", { tags })
        .andWhere("event.isCancelled = :isCancelled", { isCancelled: false });

      if (organizationId) {
        queryBuilder.andWhere("event.organizationId = :organizationId", {
          organizationId,
        });
      }

      return await queryBuilder.orderBy("event.startDate", "DESC").getMany();
    } catch (error) {
      throw new Error(`Failed to find events by tags: ${error.message}`);
    }
  }

  /**
   * 페이징 쿼리 실행 헬퍼 메서드
   * @param queryBuilder QueryBuilder
   * @param paginationOptions 페이징 옵션
   * @returns 페이징 결과
   */
  private async executePagedQuery(
    queryBuilder: SelectQueryBuilder<Event>,
    paginationOptions?: PaginationOptions
  ): Promise<PaginationResult<Event>> {
    const { page = 1, limit = 20 } = paginationOptions || {};
    const skip = (page - 1) * limit;

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
