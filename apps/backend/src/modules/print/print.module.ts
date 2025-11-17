import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PrintController } from "./print.controller";
import { PrintService } from "./print.service";
import { Event } from "../../entities/event.entity";
import { Budget } from "../../entities/budget.entity";
import { Settlement } from "../../entities/settlement.entity";
import { Organization } from "../../entities/organization.entity";
import { BudgetIncome } from "../../entities/budget-income.entity";
import { BudgetExpense } from "../../entities/budget-expense.entity";
import { SettlementIncome } from "../../entities/settlement-income.entity";
import { SettlementExpense } from "../../entities/settlement-expense.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      Budget,
      Settlement,
      Organization,
      BudgetIncome,
      BudgetExpense,
      SettlementIncome,
      SettlementExpense,
    ]),
  ],
  controllers: [PrintController],
  providers: [PrintService],
  exports: [PrintService],
})
export class PrintModule {}
