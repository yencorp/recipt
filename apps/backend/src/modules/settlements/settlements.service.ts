import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Settlement } from "../../entities/settlement.entity";
import { SettlementItem } from "../../entities/settlement-item.entity";
import { Budget } from "../../entities/budget.entity";
import { CreateSettlementDto } from "./dto/create-settlement.dto";
import { UpdateSettlementDto } from "./dto/update-settlement.dto";

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>,
    @InjectRepository(SettlementItem)
    private readonly settlementItemRepository: Repository<SettlementItem>,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>
  ) {}

  async findAll(organizationId?: string) {
    const query = this.settlementRepository
      .createQueryBuilder("settlement")
      .leftJoinAndSelect("settlement.event", "event")
      .leftJoinAndSelect("settlement.budget", "budget")
      .leftJoinAndSelect("settlement.items", "items")
      .orderBy("settlement.createdAt", "DESC");

    if (organizationId) {
      query.where("settlement.organizationId = :organizationId", {
        organizationId,
      });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    const settlement = await this.settlementRepository.findOne({
      where: { id },
      relations: ["event", "budget", "items"],
    });

    if (!settlement) {
      throw new NotFoundException("결산서를 찾을 수 없습니다.");
    }

    return settlement;
  }

  async create(createDto: CreateSettlementDto) {
    const settlement = this.settlementRepository.create(createDto);

    // 예산서가 있는 경우 예산 대비 차이 계산
    if (createDto.budgetId) {
      const budget = await this.budgetRepository.findOne({
        where: { id: createDto.budgetId },
      });

      if (budget) {
        settlement.incomeVariance =
          (createDto.totalIncomeAmount || 0) - (budget.totalIncomeAmount || 0);
        settlement.expenseVariance =
          (createDto.totalExpenseAmount || 0) -
          (budget.totalExpenseAmount || 0);
      }
    }

    // 순 결산 금액 계산
    settlement.netAmount =
      (createDto.totalIncomeAmount || 0) - (createDto.totalExpenseAmount || 0);

    return this.settlementRepository.save(settlement);
  }

  async update(id: string, updateDto: UpdateSettlementDto) {
    const settlement = await this.findOne(id);

    // 예산서가 변경되거나 금액이 변경된 경우 차이 재계산
    if (updateDto.budgetId || updateDto.totalIncomeAmount || updateDto.totalExpenseAmount) {
      const budgetId = updateDto.budgetId || settlement.budgetId;

      if (budgetId) {
        const budget = await this.budgetRepository.findOne({
          where: { id: budgetId },
        });

        if (budget) {
          updateDto.incomeVariance =
            (updateDto.totalIncomeAmount || settlement.totalIncomeAmount) -
            (budget.totalIncomeAmount || 0);
          updateDto.expenseVariance =
            (updateDto.totalExpenseAmount || settlement.totalExpenseAmount) -
            (budget.totalExpenseAmount || 0);
        }
      }

      // 순 결산 금액 재계산
      updateDto.netAmount =
        (updateDto.totalIncomeAmount || settlement.totalIncomeAmount) -
        (updateDto.totalExpenseAmount || settlement.totalExpenseAmount);
    }

    await this.settlementRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const settlement = await this.findOne(id);
    await this.settlementRepository.softRemove(settlement);
    return { message: "결산서가 삭제되었습니다.", id };
  }

  // 예산 대비 결산 비교
  async compareWithBudget(settlementId: string) {
    const settlement = await this.findOne(settlementId);

    if (!settlement.budgetId) {
      throw new NotFoundException("예산서가 연결되지 않았습니다.");
    }

    const budget = await this.budgetRepository.findOne({
      where: { id: settlement.budgetId },
      relations: ["incomes", "expenses"],
    });

    if (!budget) {
      throw new NotFoundException("예산서를 찾을 수 없습니다.");
    }

    return {
      settlement: {
        id: settlement.id,
        title: settlement.title,
        totalIncome: settlement.totalIncomeAmount,
        totalExpense: settlement.totalExpenseAmount,
        netAmount: settlement.netAmount,
      },
      budget: {
        id: budget.id,
        title: budget.title,
        totalIncome: budget.totalIncomeAmount,
        totalExpense: budget.totalExpenseAmount,
        netAmount:
          (budget.totalIncomeAmount || 0) - (budget.totalExpenseAmount || 0),
      },
      variance: {
        income: settlement.incomeVariance,
        expense: settlement.expenseVariance,
        net: settlement.netAmount - ((budget.totalIncomeAmount || 0) - (budget.totalExpenseAmount || 0)),
      },
      percentages: {
        incomeVariance: budget.totalIncomeAmount
          ? (settlement.incomeVariance / budget.totalIncomeAmount) * 100
          : 0,
        expenseVariance: budget.totalExpenseAmount
          ? (settlement.expenseVariance / budget.totalExpenseAmount) * 100
          : 0,
      },
    };
  }
}
