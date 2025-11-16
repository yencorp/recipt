import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
} from "class-validator";
import { Type } from "class-transformer";

export class UploadReceiptDto {
  @ApiProperty({ description: "업로드한 사용자 ID" })
  @IsNotEmpty()
  uploadedBy: string;

  @ApiProperty({ description: "조직 ID" })
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ description: "원본 파일명" })
  @IsNotEmpty()
  @IsString()
  originalFilename: string;

  @ApiProperty({ description: "파일 저장 경로" })
  @IsNotEmpty()
  @IsString()
  imagePath: string;

  @ApiProperty({ description: "썸네일 경로", required: false })
  @IsOptional()
  @IsString()
  thumbnailPath?: string;

  @ApiProperty({ description: "결산서 ID (선택)", required: false })
  @IsOptional()
  settlementId?: string;

  @ApiProperty({ description: "행사 ID (선택)", required: false })
  @IsOptional()
  eventId?: string;

  @ApiProperty({ description: "영수증 제목", required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: "설명", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "거래일", required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  transactionDate?: Date;

  @ApiProperty({ description: "공급업체", required: false })
  @IsOptional()
  @IsString()
  vendor?: string;
}
