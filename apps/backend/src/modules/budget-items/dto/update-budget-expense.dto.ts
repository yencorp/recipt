import { PartialType } from "@nestjs/mapped-types";
import { CreateBudgetExpenseDto } from "./create-budget-expense.dto";

export class UpdateBudgetExpenseDto extends PartialType(
  CreateBudgetExpenseDto
) {}
