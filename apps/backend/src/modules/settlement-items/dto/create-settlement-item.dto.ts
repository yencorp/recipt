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
  SettlementItemType,
  SettlementItemStatus,
  DataSource,
} from "../../../entities/settlement-item.entity";

export class CreateSettlementItemDto {
  @ApiProperty({ description: "결산서 ID" })
  @IsNotEmpty({ message: "결산서 ID는 필수입니다." })
  settlementId: string;

  @ApiProperty({ description: "영수증 스캔 ID (선택)", required: false })
  @IsOptional()
  receiptScanId?: string;

  @ApiProperty({ description: "OCR 결과 ID (선택)", required: false })
  @IsOptional()
  ocrResultId?: string;

  @ApiProperty({ description: "예산 항목 ID (선택)", required: false })
  @IsOptional()
  budgetItemId?: string;

  @ApiProperty({
    description: "항목 유형",
    enum: SettlementItemType,
  })
  @IsEnum(SettlementItemType)
  type: SettlementItemType;

  @ApiProperty({
    description: "항목 상태",
    enum: SettlementItemStatus,
    required: false,
    default: SettlementItemStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(SettlementItemStatus)
  status?: SettlementItemStatus;

  @ApiProperty({
    description: "데이터 출처",
    enum: DataSource,
    required: false,
    default: DataSource.MANUAL,
  })
  @IsOptional()
  @IsEnum(DataSource)
  dataSource?: DataSource;

  @ApiProperty({ description: "항목명", example: "회의실 대여" })
  @IsNotEmpty({ message: "항목명은 필수입니다." })
  @Length(1, 200)
  itemName: string;

  @ApiProperty({ description: "항목 설명", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "카테고리", required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: "실제 금액", example: 50000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  actualAmount: number;

  @ApiProperty({ description: "예산 금액", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAmount?: number;

  @ApiProperty({ description: "거래일", required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  transactionDate?: Date;

  @ApiProperty({ description: "공급업체/거래처", required: false })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiProperty({ description: "메모", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
