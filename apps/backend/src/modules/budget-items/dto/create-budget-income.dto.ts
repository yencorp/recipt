import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Length,
  IsNumber,
  Min,
  IsDate,
  IsBoolean,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import {
  IncomeCategory,
  IncomeStatus,
} from "../../../entities/budget-income.entity";

export class CreateBudgetIncomeDto {
  @ApiProperty({ description: "예산 ID" })
  @IsNotEmpty({ message: "예산 ID는 필수입니다." })
  budgetId: string;

  @ApiProperty({ description: "수입 항목명", example: "후원금" })
  @IsNotEmpty({ message: "수입 항목명은 필수입니다." })
  @Length(2, 200)
  itemName: string;

  @ApiProperty({ description: "수입 설명", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "수입 카테고리",
    enum: IncomeCategory,
  })
  @IsEnum(IncomeCategory)
  category: IncomeCategory;

  @ApiProperty({
    description: "수입 상태",
    enum: IncomeStatus,
    required: false,
    default: IncomeStatus.PLANNED,
  })
  @IsOptional()
  @IsEnum(IncomeStatus)
  status?: IncomeStatus;

  @ApiProperty({ description: "예산 금액", example: 1000000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  budgetAmount: number;

  @ApiProperty({ description: "실제 수입 금액", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualAmount?: number;

  @ApiProperty({ description: "수입처/기부자", required: false })
  @IsOptional()
  @Length(1, 100)
  source?: string;

  @ApiProperty({ description: "담당자", required: false })
  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @ApiProperty({ description: "예상 수입일", required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expectedDate?: Date;

  @ApiProperty({ description: "실제 수입일", required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  receivedDate?: Date;

  @ApiProperty({ description: "수입 방법", required: false })
  @IsOptional()
  @IsString()
  receiptMethod?: string;

  @ApiProperty({ description: "참조번호", required: false })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiProperty({ description: "세금공제 가능 여부", required: false })
  @IsOptional()
  @IsBoolean()
  isTaxDeductible?: boolean;

  @ApiProperty({ description: "정기 수입 여부", required: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({ description: "정기 수입 주기", required: false })
  @IsOptional()
  @IsString()
  recurringCycle?: string;

  @ApiProperty({ description: "표시 순서", required: false })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiProperty({ description: "메모", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
