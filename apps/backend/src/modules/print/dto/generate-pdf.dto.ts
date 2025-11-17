import { IsEnum, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum PDFType {
  BUDGET = "BUDGET",
  SETTLEMENT = "SETTLEMENT",
  BUDGET_DETAIL = "BUDGET_DETAIL",
  SETTLEMENT_DETAIL = "SETTLEMENT_DETAIL",
}

export class GeneratePDFDto {
  @ApiProperty({
    description: "PDF 생성 타입",
    enum: PDFType,
    example: PDFType.BUDGET,
  })
  @IsEnum(PDFType)
  type: PDFType;

  @ApiProperty({
    description: "이벤트 ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  eventId: string;
}
