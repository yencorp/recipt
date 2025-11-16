import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BudgetIncome } from "../../entities/budget-income.entity";
import { BudgetExpense } from "../../entities/budget-expense.entity";
import { Budget } from "../../entities/budget.entity";
import { CreateBudgetIncomeDto } from "./dto/create-budget-income.dto";
import { UpdateBudgetIncomeDto } from "./dto/update-budget-income.dto";
import { CreateBudgetExpenseDto } from "./dto/create-budget-expense.dto";
import { UpdateBudgetExpenseDto } from "./dto/update-budget-expense.dto";

@Injectable()
export class BudgetItemsService {
  constructor(
    @InjectRepository(BudgetIncome)
    private readonly budgetIncomeRepository: Repository<BudgetIncome>,
    @InjectRepository(BudgetExpense)
    private readonly budgetExpenseRepository: Repository<BudgetExpense>,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>
  ) {}

  // ===== 수입 항목 관리 =====

  async findAllIncomes(budgetId?: string) {
    const query =
      this.budgetIncomeRepository.createQueryBuilder("budgetIncome");

    if (budgetId) {
      query.where("budgetIncome.budgetId = :budgetId", { budgetId });
    }

    return query
      .orderBy("budgetIncome.displayOrder", "ASC")
      .addOrderBy("budgetIncome.createdAt", "DESC")
      .getMany();
  }

  async findOneIncome(id: string) {
    const income = await this.budgetIncomeRepository.findOne({
      where: { id },
      relations: ["budget"],
    });

    if (!income) {
      throw new NotFoundException("수입 항목을 찾을 수 없습니다.");
    }

    return income;
  }

  async createIncome(createDto: CreateBudgetIncomeDto) {
    const income = this.budgetIncomeRepository.create(createDto);
    const saved = await this.budgetIncomeRepository.save(income);

    // 예산서 집계 업데이트
    await this.updateBudgetTotals(createDto.budgetId);

    return saved;
  }

  async updateIncome(id: string, updateDto: UpdateBudgetIncomeDto) {
    const income = await this.findOneIncome(id);

    await this.budgetIncomeRepository.update(id, updateDto);
    const updated = await this.findOneIncome(id);

    // 예산서 집계 업데이트
    await this.updateBudgetTotals(income.budgetId);

    return updated;
  }

  async removeIncome(id: string) {
    const income = await this.findOneIncome(id);
    const budgetId = income.budgetId;

    await this.budgetIncomeRepository.softRemove(income);

    // 예산서 집계 업데이트
    await this.updateBudgetTotals(budgetId);

    return { message: "수입 항목이 삭제되었습니다.", id };
  }

  // ===== 지출 항목 관리 =====

  async findAllExpenses(budgetId?: string) {
    const query =
      this.budgetExpenseRepository.createQueryBuilder("budgetExpense");

    if (budgetId) {
      query.where("budgetExpense.budgetId = :budgetId", { budgetId });
    }

    return query
      .orderBy("budgetExpense.displayOrder", "ASC")
      .addOrderBy("budgetExpense.createdAt", "DESC")
      .getMany();
  }

  async findOneExpense(id: string) {
    const expense = await this.budgetExpenseRepository.findOne({
      where: { id },
      relations: ["budget"],
    });

    if (!expense) {
      throw new NotFoundException("지출 항목을 찾을 수 없습니다.");
    }

    return expense;
  }

  async createExpense(createDto: CreateBudgetExpenseDto) {
    const expense = this.budgetExpenseRepository.create(createDto);
    const saved = await this.budgetExpenseRepository.save(expense);

    // 예산서 집계 업데이트
    await this.updateBudgetTotals(createDto.budgetId);

    return saved;
  }

  async updateExpense(id: string, updateDto: UpdateBudgetExpenseDto) {
    const expense = await this.findOneExpense(id);

    await this.budgetExpenseRepository.update(id, updateDto);
    const updated = await this.findOneExpense(id);

    // 예산서 집계 업데이트
    await this.updateBudgetTotals(expense.budgetId);

    return updated;
  }

  async removeExpense(id: string) {
    const expense = await this.findOneExpense(id);
    const budgetId = expense.budgetId;

    await this.budgetExpenseRepository.softRemove(expense);

    // 예산서 집계 업데이트
    await this.updateBudgetTotals(budgetId);

    return { message: "지출 항목이 삭제되었습니다.", id };
  }

  // ===== 예산 집계 및 계산 =====

  async getBudgetSummary(budgetId: string) {
    const incomes = await this.findAllIncomes(budgetId);
    const expenses = await this.findAllExpenses(budgetId);

    const incomeSummary = this.calculateIncomeSummary(incomes);
    const expenseSummary = this.calculateExpenseSummary(expenses);

    return {
      budgetId,
      income: incomeSummary,
      expense: expenseSummary,
      netBudget:
        incomeSummary.totalBudgetAmount - expenseSummary.totalBudgetAmount,
      netActual: incomeSummary.totalActualAmount - expenseSummary.totalActualAmount,
      isOverBudget: expenseSummary.totalActualAmount > expenseSummary.totalBudgetAmount,
      overBudgetAmount: Math.max(
        0,
        expenseSummary.totalActualAmount - expenseSummary.totalBudgetAmount
      ),
    };
  }

  private calculateIncomeSummary(incomes: BudgetIncome[]) {
    return {
      totalBudgetAmount: incomes.reduce(
        (sum, item) => sum + Number(item.budgetAmount),
        0
      ),
      totalActualAmount: incomes.reduce(
        (sum, item) => sum + Number(item.actualAmount || 0),
        0
      ),
      count: incomes.length,
      byCategory: this.groupByCategory(incomes, "category"),
    };
  }

  private calculateExpenseSummary(expenses: BudgetExpense[]) {
    return {
      totalBudgetAmount: expenses.reduce(
        (sum, item) => sum + Number(item.budgetAmount),
        0
      ),
      totalActualAmount: expenses.reduce(
        (sum, item) => sum + Number(item.actualAmount || 0),
        0
      ),
      count: expenses.length,
      byCategory: this.groupByCategory(expenses, "category"),
    };
  }

  private groupByCategory(items: any[], field: string) {
    return items.reduce((acc, item) => {
      const category = item[field];
      if (!acc[category]) {
        acc[category] = {
          budgetAmount: 0,
          actualAmount: 0,
          count: 0,
        };
      }
      acc[category].budgetAmount += Number(item.budgetAmount);
      acc[category].actualAmount += Number(item.actualAmount || 0);
      acc[category].count += 1;
      return acc;
    }, {});
  }

  private async updateBudgetTotals(budgetId: string) {
    const summary = await this.getBudgetSummary(budgetId);

    await this.budgetRepository.update(budgetId, {
      totalIncomeAmount: summary.income.totalBudgetAmount,
      totalExpenseAmount: summary.expense.totalBudgetAmount,
    });
  }

  // ===== 카테고리별 조회 =====

  async getIncomesByCategory(budgetId: string, category: string) {
    return this.budgetIncomeRepository.find({
      where: { budgetId, category: category as any },
      order: { displayOrder: "ASC", createdAt: "DESC" },
    });
  }

  async getExpensesByCategory(budgetId: string, category: string) {
    return this.budgetExpenseRepository.find({
      where: { budgetId, category: category as any },
      order: { displayOrder: "ASC", createdAt: "DESC" },
    });
  }
}
