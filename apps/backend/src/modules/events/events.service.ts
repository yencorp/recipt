import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, Between, In } from "typeorm";
import { Event, EventStatus } from "../../entities/event.entity";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { EventFilterDto } from "./dto/event-filter.dto";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto, userId: string) {
    const event = this.eventRepository.create({
      ...createEventDto,
      createdBy: userId,
      status: createEventDto.status || EventStatus.DRAFT,
      currentParticipants: 0,
      isActive: true,
      isCancelled: false,
    });

    return this.eventRepository.save(event);
  }

  async findAll(filterDto?: EventFilterDto) {
    const {
      organizationId,
      type,
      status,
      visibility,
      startDateFrom,
      startDateTo,
      search,
      page = 1,
      limit = 20,
    } = filterDto || {};

    const query = this.eventRepository
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.organization", "organization");

    // 필터링 조건 적용
    if (organizationId) {
      query.andWhere("event.organizationId = :organizationId", {
        organizationId,
      });
    }

    if (type) {
      query.andWhere("event.type = :type", { type });
    }

    if (status) {
      query.andWhere("event.status = :status", { status });
    }

    if (visibility) {
      query.andWhere("event.visibility = :visibility", { visibility });
    }

    if (startDateFrom) {
      query.andWhere("event.startDate >= :startDateFrom", { startDateFrom });
    }

    if (startDateTo) {
      query.andWhere("event.startDate <= :startDateTo", { startDateTo });
    }

    if (search) {
      query.andWhere(
        "(event.title LIKE :search OR event.description LIKE :search)",
        { search: `%${search}%` },
      );
    }

    // 페이징
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // 정렬: 시작일 내림차순
    query.orderBy("event.startDate", "DESC");

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ["organization", "budgets", "settlements"],
    });

    if (!event) {
      throw new NotFoundException("행사를 찾을 수 없습니다.");
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string) {
    const event = await this.findOne(id);

    // 작성자 또는 관리자만 수정 가능 (컨트롤러 레벨에서 추가 검증)
    // 여기서는 서비스 레벨 검증

    await this.eventRepository.update(id, updateEventDto);
    return this.findOne(id);
  }

  async remove(id: string, userId: string) {
    const event = await this.findOne(id);

    // 연관된 예산이나 정산이 있는 경우 삭제 불가
    if (event.budgets?.length > 0 || event.settlements?.length > 0) {
      throw new ForbiddenException(
        "예산 또는 정산이 연결된 행사는 삭제할 수 없습니다.",
      );
    }

    await this.eventRepository.remove(event);
    return { message: "행사가 삭제되었습니다." };
  }

  // 상태 관리 메서드
  async approve(id: string, userId: string) {
    const event = await this.findOne(id);

    event.approve(userId);
    await this.eventRepository.save(event);

    return event;
  }

  async start(id: string) {
    const event = await this.findOne(id);

    event.start();
    await this.eventRepository.save(event);

    return event;
  }

  async complete(id: string) {
    const event = await this.findOne(id);

    event.complete();
    await this.eventRepository.save(event);

    return event;
  }

  async cancel(id: string, reason?: string) {
    const event = await this.findOne(id);

    event.cancel(reason);
    await this.eventRepository.save(event);

    return event;
  }

  async postpone(id: string) {
    const event = await this.findOne(id);

    event.postpone();
    await this.eventRepository.save(event);

    return event;
  }

  // 조직별 행사 조회
  async findByOrganization(organizationId: string) {
    return this.eventRepository.find({
      where: { organizationId },
      relations: ["budgets", "settlements"],
      order: { startDate: "DESC" },
    });
  }
}
