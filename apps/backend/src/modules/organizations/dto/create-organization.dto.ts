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
  @IsNotEmpty({ message: "조직명은 필수 입력 항목입니다." })
  @Length(2, 100, { message: "조직명은 2자 이상 100자 이하로 입력해주세요." })
  name: string;

  @IsEnum(OrganizationType, { message: "유효한 조직 유형을 선택해주세요." })
  type: OrganizationType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(OrganizationStatus, { message: "유효한 조직 상태를 선택해주세요." })
  status?: OrganizationStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  priority?: number;

  @IsOptional()
  @Length(2, 100, {
    message: "대표자 이름은 2자 이상 100자 이하로 입력해주세요.",
  })
  representative?: string;

  @IsOptional()
  @IsEmail({}, { message: "유효한 이메일 주소를 입력해주세요." })
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl({}, { message: "유효한 URL을 입력해주세요." })
  websiteUrl?: string;

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
