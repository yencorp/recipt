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
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";
import {
  SettlementType,
  ApprovalLevel,
} from "../../../entities/settlement.entity";

export class CreateSettlementDto {
  @ApiProperty({ description: "조직 ID" })
  @IsNotEmpty({ message: "조직 ID는 필수입니다." })
  organizationId: string;

  @ApiProperty({ description: "행사 ID (선택)", required: false })
  @IsOptional()
  eventId?: string;

  @ApiProperty({ description: "예산서 ID (선택)", required: false })
  @IsOptional()
  budgetId?: string;

  @ApiProperty({ description: "작성자 ID" })
  @IsNotEmpty({ message: "작성자 ID는 필수입니다." })
  createdBy: string;

  @ApiProperty({ description: "결산 제목", example: "2025년 하계 수련회 결산" })
  @IsNotEmpty({ message: "결산 제목은 필수입니다." })
  @Length(2, 200)
  title: string;

  @ApiProperty({ description: "결산 설명", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "결산 유형",
    enum: SettlementType,
  })
  @IsEnum(SettlementType)
  type: SettlementType;

  @ApiProperty({
    description: "필요 승인 수준",
    enum: ApprovalLevel,
    required: false,
    default: ApprovalLevel.TREASURER,
  })
  @IsOptional()
  @IsEnum(ApprovalLevel)
  approvalLevel?: ApprovalLevel;

  @ApiProperty({ description: "결산 연도", example: 2025 })
  @IsNotEmpty()
  @IsInt()
  @Min(2020)
  settlementYear: number;

  @ApiProperty({ description: "결산 월 (1-12)", required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  settlementMonth?: number;

  @ApiProperty({ description: "결산 기간 시작일", example: "2025-07-01" })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  periodStartDate: Date;

  @ApiProperty({ description: "결산 기간 종료일", example: "2025-07-03" })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  periodEndDate: Date;

  @ApiProperty({ description: "총 수입 금액", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalIncomeAmount?: number;

  @ApiProperty({ description: "총 지출 금액", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalExpenseAmount?: number;
}
