import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Settlement } from "../../entities/settlement.entity";
import { SettlementItem } from "../../entities/settlement-item.entity";

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>,
    @InjectRepository(SettlementItem)
    private readonly settlementItemRepository: Repository<SettlementItem>
  ) {}

  async findAll() {
    return this.settlementRepository.find({
      relations: ["event", "settlementItems", "receiptScans"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string) {
    const settlement = await this.settlementRepository.findOne({
      where: { id },
      relations: ["event", "settlementItems", "receiptScans"],
    });

    if (!settlement) {
      throw new Error("결산서를 찾을 수 없습니다.");
    }

    return settlement;
  }

  async create(createSettlementDto: any) {
    // TODO: DTO 유효성 검증 구현
    const settlement = this.settlementRepository.create(createSettlementDto);
    return this.settlementRepository.save(settlement);
  }

  async update(id: string, updateSettlementDto: any) {
    await this.findOne(id);

    await this.settlementRepository.update(id, updateSettlementDto);
    return this.findOne(id);
  }
}
