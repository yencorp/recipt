import { PartialType } from "@nestjs/mapped-types";
import { CreateBudgetIncomeDto } from "./create-budget-income.dto";

export class UpdateBudgetIncomeDto extends PartialType(
  CreateBudgetIncomeDto
) {}
