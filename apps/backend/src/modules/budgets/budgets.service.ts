import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Budget } from "../../entities/budget.entity";
import { BudgetIncome } from "../../entities/budget-income.entity";
import { BudgetExpense } from "../../entities/budget-expense.entity";

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

  async findAll() {
    return this.budgetRepository.find({
      relations: ["event", "budgetIncomes", "budgetExpenses"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string) {
    const budget = await this.budgetRepository.findOne({
      where: { id },
      relations: ["event", "budgetIncomes", "budgetExpenses"],
    });

    if (!budget) {
      throw new Error("예산서를 찾을 수 없습니다.");
    }

    return budget;
  }

  async create(createBudgetDto: any) {
    // TODO: DTO 유효성 검증 구현
    const budget = this.budgetRepository.create(createBudgetDto);
    return this.budgetRepository.save(budget);
  }

  async update(id: string, updateBudgetDto: any) {
    await this.findOne(id);

    await this.budgetRepository.update(id, updateBudgetDto);
    return this.findOne(id);
  }
}
