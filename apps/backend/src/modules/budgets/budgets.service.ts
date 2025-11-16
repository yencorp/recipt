import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Budget } from "../../entities/budget.entity";
import { BudgetIncome } from "../../entities/budget-income.entity";
import { BudgetExpense } from "../../entities/budget-expense.entity";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetIncome)
    private readonly budgetIncomeRepository: Repository<BudgetIncome>,
    @InjectRepository(BudgetExpense)
    private readonly budgetExpenseRepository: Repository<BudgetExpense>
  ) {}

  async findAll(organizationId?: string) {
    const query = this.budgetRepository
      .createQueryBuilder("budget")
      .leftJoinAndSelect("budget.event", "event")
      .leftJoinAndSelect("budget.budgetIncomes", "budgetIncomes")
      .leftJoinAndSelect("budget.budgetExpenses", "budgetExpenses")
      .orderBy("budget.createdAt", "DESC");

    if (organizationId) {
      query.where("budget.organizationId = :organizationId", {
        organizationId,
      });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    const budget = await this.budgetRepository.findOne({
      where: { id },
      relations: ["event", "budgetIncomes", "budgetExpenses"],
    });

    if (!budget) {
      throw new NotFoundException("예산서를 찾을 수 없습니다.");
    }

    return budget;
  }

  async create(createBudgetDto: CreateBudgetDto) {
    // 행사당 하나의 예산서만 생성 가능
    if (createBudgetDto.eventId) {
      const existingBudget = await this.budgetRepository.findOne({
        where: { eventId: createBudgetDto.eventId },
      });

      if (existingBudget) {
        throw new ConflictException(
          "해당 행사에는 이미 예산서가 존재합니다."
        );
      }
    }

    const budget = this.budgetRepository.create(createBudgetDto);
    return this.budgetRepository.save(budget);
  }

  async update(id: string, updateBudgetDto: UpdateBudgetDto) {
    const budget = await this.findOne(id);

    // eventId 변경 시 중복 체크
    if (
      updateBudgetDto.eventId &&
      updateBudgetDto.eventId !== budget.eventId
    ) {
      const existingBudget = await this.budgetRepository.findOne({
        where: { eventId: updateBudgetDto.eventId },
      });

      if (existingBudget) {
        throw new ConflictException(
          "해당 행사에는 이미 예산서가 존재합니다."
        );
      }
    }

    await this.budgetRepository.update(id, updateBudgetDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const budget = await this.findOne(id);
    await this.budgetRepository.softRemove(budget);
    return { message: "예산서가 삭제되었습니다.", id };
  }
}
