import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";
import { Budget } from "../../entities/budget.entity";
import { BudgetIncome } from "../../entities/budget-income.entity";
import { BudgetExpense } from "../../entities/budget-expense.entity";
import { Event } from "../../entities/event.entity";
import { Settlement } from "../../entities/settlement.entity";
import { EventCreatorOrOrgAdminGuard } from "../../common/guards/event-creator-or-org-admin.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Budget,
      BudgetIncome,
      BudgetExpense,
      Event,
      Settlement,
    ]),
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService, EventCreatorOrOrgAdminGuard],
  exports: [BudgetsService],
})
export class BudgetsModule {}
