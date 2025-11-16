import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Length,
  IsInt,
  Min,
  IsDate,
  IsNumber,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import { BudgetType } from "../../../entities/budget.entity";

export class CreateBudgetDto {
  @ApiProperty({ description: "조직 ID" })
  @IsNotEmpty({ message: "조직 ID는 필수입니다." })
  organizationId: string;

  @ApiProperty({ description: "행사 ID (선택)", required: false })
  @IsOptional()
  eventId?: string;

  @ApiProperty({
    description: "예산 제목",
    example: "2025년 하계 수련회 예산",
  })
  @IsNotEmpty({ message: "예산 제목은 필수입니다." })
  @Length(2, 200)
  title: string;

  @ApiProperty({ description: "예산 설명", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "예산 유형", enum: BudgetType })
  @IsEnum(BudgetType)
  type: BudgetType;

  @ApiProperty({ description: "예산 연도", example: 2025 })
  @IsNotEmpty()
  @IsInt()
  @Min(2020)
  budgetYear: number;

  @ApiProperty({ description: "예산 기간 (월/분기)", required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  budgetPeriod?: number;

  @ApiProperty({ description: "시작일", example: "2025-07-01" })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  periodStartDate: Date;

  @ApiProperty({ description: "종료일", example: "2025-07-03" })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  periodEndDate: Date;

  @ApiProperty({ description: "총 수입 예산", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalIncomeAmount?: number;

  @ApiProperty({ description: "총 지출 예산", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalExpenseAmount?: number;
}
