import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Length,
  IsDate,
  IsDecimal,
  Min,
  IsUrl,
  IsObject,
  IsString,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import {
  EventType,
  EventStatus,
  EventVisibility,
} from "../../../entities/event.entity";

export class CreateEventDto {
  @ApiProperty({ description: "조직 ID" })
  @IsNotEmpty({ message: "조직 ID는 필수 입력 항목입니다." })
  organizationId: string;

  @ApiProperty({
    description: "행사명",
    example: "2025년 하계 수련회",
    minLength: 2,
    maxLength: 200,
  })
  @IsNotEmpty({ message: "행사명은 필수 입력 항목입니다." })
  @Length(2, 200, { message: "행사명은 2자 이상 200자 이하로 입력해주세요." })
  title: string;

  @ApiProperty({ description: "행사 설명", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "행사 유형", enum: EventType })
  @IsEnum(EventType, { message: "유효한 행사 유형을 선택해주세요." })
  type: EventType;

  @ApiProperty({
    description: "행사 상태",
    enum: EventStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventStatus, { message: "유효한 행사 상태를 선택해주세요." })
  status?: EventStatus;

  @ApiProperty({
    description: "공개 설정",
    enum: EventVisibility,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventVisibility, { message: "유효한 공개 설정을 선택해주세요." })
  visibility?: EventVisibility;

  @ApiProperty({ description: "시작일", example: "2025-07-01" })
  @IsNotEmpty({ message: "시작일은 필수 입력 항목입니다." })
  @Type(() => Date)
  @IsDate({ message: "유효한 시작일을 입력해주세요." })
  startDate: Date;

  @ApiProperty({ description: "종료일", example: "2025-07-03" })
  @IsNotEmpty({ message: "종료일은 필수 입력 항목입니다." })
  @Type(() => Date)
  @IsDate({ message: "유효한 종료일을 입력해주세요." })
  endDate: Date;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @Length(1, 200, { message: "장소는 1자 이상 200자 이하로 입력해주세요." })
  location?: string;

  @IsOptional()
  @IsString()
  locationDetails?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: "참가비는 0 이상이어야 합니다." })
  estimatedCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: "최대 참가자 수는 1 이상이어야 합니다." })
  maxParticipants?: number;

  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @IsOptional()
  @IsString()
  responsibleContact?: string;

  @IsOptional()
  @IsUrl({}, { message: "유효한 URL을 입력해주세요." })
  websiteUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    tags?: string[];
    categories?: string[];
    requirements?: string[];
    materials?: string[];
    agenda?: Array<{
      time: string;
      title: string;
      description?: string;
      speaker?: string;
    }>;
    [key: string]: any;
  };

  @IsOptional()
  @IsString()
  notes?: string;
}
