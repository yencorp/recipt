import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Length,
  IsNumber,
  Min,
  IsDate,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import {
  ExpenseCategory,
  ExpenseStatus,
} from "../../../entities/budget-expense.entity";

export class CreateBudgetExpenseDto {
  @ApiProperty({ description: "예산 ID" })
  @IsNotEmpty({ message: "예산 ID는 필수입니다." })
  budgetId: string;

  @ApiProperty({ description: "지출 항목명", example: "회의실 대여" })
  @IsNotEmpty({ message: "지출 항목명은 필수입니다." })
  @Length(2, 200)
  itemName: string;

  @ApiProperty({ description: "지출 설명", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "지출 카테고리",
    enum: ExpenseCategory,
  })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({
    description: "지출 상태",
    enum: ExpenseStatus,
    required: false,
    default: ExpenseStatus.PLANNED,
  })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @ApiProperty({ description: "예산 금액", example: 500000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  budgetAmount: number;

  @ApiProperty({ description: "실제 지출 금액", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualAmount?: number;

  @ApiProperty({ description: "수량", required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiProperty({ description: "단가", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiProperty({ description: "공급업체/판매처", required: false })
  @IsOptional()
  @Length(1, 100)
  vendor?: string;

  @ApiProperty({ description: "공급업체 연락처", required: false })
  @IsOptional()
  @IsString()
  vendorContact?: string;

  @ApiProperty({ description: "담당자", required: false })
  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @ApiProperty({ description: "계획 구매/지출일", required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  plannedDate?: Date;

  @ApiProperty({ description: "실제 구매/지출일", required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualDate?: Date;

  @ApiProperty({ description: "지출 방법", required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ description: "영수증 번호", required: false })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiProperty({ description: "표시 순서", required: false })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiProperty({ description: "메모", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
