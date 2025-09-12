import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Event } from "../../entities/event.entity";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>
  ) {}

  async findAll() {
    return this.eventRepository.find({
      relations: ["organization", "budgets", "settlements"],
      order: { startDate: "DESC" },
    });
  }

  async findOne(id: string) {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ["organization", "budgets", "settlements"],
    });

    if (!event) {
      throw new Error("행사를 찾을 수 없습니다.");
    }

    return event;
  }

  async create(createEventDto: any) {
    // TODO: DTO 유효성 검증 구현
    const event = this.eventRepository.create(createEventDto);
    return this.eventRepository.save(event);
  }

  async update(id: string, updateEventDto: any) {
    await this.findOne(id);

    await this.eventRepository.update(id, updateEventDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
    return { message: "행사가 삭제되었습니다." };
  }
}
