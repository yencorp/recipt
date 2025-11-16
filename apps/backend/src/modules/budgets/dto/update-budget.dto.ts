import { PartialType } from "@nestjs/mapped-types";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsEnum } from "class-validator";
import { CreateBudgetDto } from "./create-budget.dto";
import { BudgetStatus, ApprovalStatus } from "../../../entities/budget.entity";

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {
  @ApiProperty({
    description: "예산 상태",
    enum: BudgetStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @ApiProperty({
    description: "승인 상태",
    enum: ApprovalStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @ApiProperty({ description: "검토 의견", required: false })
  @IsOptional()
  reviewNotes?: string;

  @ApiProperty({ description: "승인/반려 의견", required: false })
  @IsOptional()
  approvalNotes?: string;
}
