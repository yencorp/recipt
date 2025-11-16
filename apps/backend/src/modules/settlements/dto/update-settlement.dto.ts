import { PartialType } from "@nestjs/mapped-types";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsEnum, IsString } from "class-validator";
import { CreateSettlementDto } from "./create-settlement.dto";
import { SettlementStatus } from "../../../entities/settlement.entity";

export class UpdateSettlementDto extends PartialType(CreateSettlementDto) {
  @ApiProperty({
    description: "결산 상태",
    enum: SettlementStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;

  @ApiProperty({ description: "검토 의견", required: false })
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @ApiProperty({ description: "승인/반려 의견", required: false })
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}
