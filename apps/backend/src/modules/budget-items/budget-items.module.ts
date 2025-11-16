import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BudgetItemsController } from "./budget-items.controller";
import { BudgetItemsService } from "./budget-items.service";
import { BudgetIncome } from "../../entities/budget-income.entity";
import { BudgetExpense } from "../../entities/budget-expense.entity";
import { Budget } from "../../entities/budget.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BudgetIncome, BudgetExpense, Budget])],
  controllers: [BudgetItemsController],
  providers: [BudgetItemsService],
  exports: [BudgetItemsService],
})
export class BudgetItemsModule {}
