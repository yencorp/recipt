import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SettlementItem } from "../../entities/settlement-item.entity";
import { Settlement } from "../../entities/settlement.entity";
import { CreateSettlementItemDto } from "./dto/create-settlement-item.dto";
import { UpdateSettlementItemDto } from "./dto/update-settlement-item.dto";

@Injectable()
export class SettlementItemsService {
  constructor(
    @InjectRepository(SettlementItem)
    private readonly settlementItemRepository: Repository<SettlementItem>,
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>
  ) {}

  async findAll(settlementId?: string) {
    const query = this.settlementItemRepository
      .createQueryBuilder("settlementItem")
      .leftJoinAndSelect("settlementItem.receiptScan", "receiptScan")
      .leftJoinAndSelect("settlementItem.ocrResult", "ocrResult")
      .orderBy("settlementItem.transactionDate", "DESC")
      .addOrderBy("settlementItem.createdAt", "DESC");

    if (settlementId) {
      query.where("settlementItem.settlementId = :settlementId", {
        settlementId,
      });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    const item = await this.settlementItemRepository.findOne({
      where: { id },
      relations: ["settlement", "receiptScan", "ocrResult"],
    });

    if (!item) {
      throw new NotFoundException("결산 항목을 찾을 수 없습니다.");
    }

    return item;
  }

  async create(createDto: CreateSettlementItemDto) {
    const item = this.settlementItemRepository.create(createDto);
    const saved = await this.settlementItemRepository.save(item);

    // 결산서 총액 업데이트
    await this.updateSettlementTotals(createDto.settlementId);

    return saved;
  }

  async update(id: string, updateDto: UpdateSettlementItemDto) {
    const item = await this.findOne(id);

    await this.settlementItemRepository.update(id, updateDto);
    const updated = await this.findOne(id);

    // 결산서 총액 업데이트
    await this.updateSettlementTotals(item.settlementId);

    return updated;
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    const settlementId = item.settlementId;

    await this.settlementItemRepository.softRemove(item);

    // 결산서 총액 업데이트
    await this.updateSettlementTotals(settlementId);

    return { message: "결산 항목이 삭제되었습니다.", id };
  }

  // OCR 결과를 결산 항목으로 매핑
  async mapFromOcrResult(settlementId: string, ocrResultId: string) {
    // OCR 결과를 기반으로 결산 항목 자동 생성
    // 실제 구현시 OcrResult entity를 조회하여 데이터 매핑

    // 임시 구현: 수동으로 결산 항목 생성 필요
    throw new Error("OCR 매핑 기능은 OCR 서비스 구현 후 활성화됩니다.");
  }

  // 결산서 총액 자동 업데이트
  private async updateSettlementTotals(settlementId: string) {
    const items = await this.findAll(settlementId);

    const totalIncome = items
      .filter((item) => item.type === "INCOME")
      .reduce((sum, item) => sum + Number(item.actualAmount), 0);

    const totalExpense = items
      .filter((item) => item.type === "EXPENSE")
      .reduce((sum, item) => sum + Number(item.actualAmount), 0);

    const netAmount = totalIncome - totalExpense;

    await this.settlementRepository.update(settlementId, {
      totalIncomeAmount: totalIncome,
      totalExpenseAmount: totalExpense,
      netAmount,
    });
  }

  // 데이터 출처별 조회
  async findByDataSource(settlementId: string, dataSource: string) {
    return this.settlementItemRepository.find({
      where: { settlementId, dataSource: dataSource as any },
      relations: ["receiptScan", "ocrResult"],
      order: { transactionDate: "DESC", createdAt: "DESC" },
    });
  }

  // 카테고리별 조회
  async findByCategory(settlementId: string, category: string) {
    return this.settlementItemRepository.find({
      where: { settlementId, category },
      order: { transactionDate: "DESC", createdAt: "DESC" },
    });
  }
}
