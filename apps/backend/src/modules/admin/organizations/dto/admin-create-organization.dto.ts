import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import {
  OrganizationType,
  OrganizationStatus,
} from "../../../../entities/organization.entity";

export class AdminCreateOrganizationDto {
  @ApiProperty({
    description: "단체명",
    example: "서울대학교 총학생회",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: "단체 유형",
    enum: OrganizationType,
    example: OrganizationType.YOUTH_GROUP,
  })
  @IsEnum(OrganizationType)
  @IsNotEmpty()
  type: OrganizationType;

  @ApiProperty({
    description: "단체 설명",
    example: "서울대학교 학생 대표 기구",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: "연락처",
    example: "02-1234-5678",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  @ApiProperty({
    description: "이메일",
    example: "contact@example.org",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactEmail?: string;

  @ApiProperty({
    description: "주소",
    example: "서울특별시 관악구",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @ApiProperty({
    description: "단체 상태",
    enum: OrganizationStatus,
    example: OrganizationStatus.ACTIVE,
    required: false,
  })
  @IsEnum(OrganizationStatus)
  @IsOptional()
  status?: OrganizationStatus;
}
