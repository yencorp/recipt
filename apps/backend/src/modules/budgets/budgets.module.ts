import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";
import { Budget } from "../../entities/budget.entity";
import { BudgetIncome } from "../../entities/budget-income.entity";
import { BudgetExpense } from "../../entities/budget-expense.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Budget, BudgetIncome, BudgetExpense])],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
