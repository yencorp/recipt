import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Length,
  IsEmail,
  IsUrl,
  IsString,
  IsNumber,
  Min,
  IsObject,
} from "class-validator";
import {
  OrganizationType,
  OrganizationStatus,
} from "../../../entities/organization.entity";

export class CreateOrganizationDto {
  @ApiProperty({
    description: "조직명",
    example: "청소년위원회",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: "조직명은 필수 입력 항목입니다." })
  @Length(2, 100, { message: "조직명은 2자 이상 100자 이하로 입력해주세요." })
  name: string;

  @ApiProperty({ description: "조직 유형", enum: OrganizationType })
  @IsEnum(OrganizationType, { message: "유효한 조직 유형을 선택해주세요." })
  type: OrganizationType;

  @ApiProperty({ description: "조직 설명", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "조직 상태",
    enum: OrganizationStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrganizationStatus, { message: "유효한 조직 상태를 선택해주세요." })
  status?: OrganizationStatus;

  @ApiProperty({ description: "표시 우선순위", required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  priority?: number;

  @ApiProperty({ description: "대표자 이름", required: false })
  @IsOptional()
  @Length(2, 100, {
    message: "대표자 이름은 2자 이상 100자 이하로 입력해주세요.",
  })
  representative?: string;

  @ApiProperty({ description: "연락처 이메일", required: false })
  @IsOptional()
  @IsEmail({}, { message: "유효한 이메일 주소를 입력해주세요." })
  contactEmail?: string;

  @ApiProperty({ description: "연락처 전화번호", required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ description: "주소", required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: "웹사이트 URL", required: false })
  @IsOptional()
  @IsUrl({}, { message: "유효한 URL을 입력해주세요." })
  websiteUrl?: string;

  @ApiProperty({ description: "조직 설정", required: false })
  @IsOptional()
  @IsObject()
  settings?: {
    allowPublicBudgets?: boolean;
    requireReceiptApproval?: boolean;
    autoGenerateReports?: boolean;
    fiscalYearStart?: string;
    budgetApprovalWorkflow?: boolean;
    [key: string]: any;
  };
}
