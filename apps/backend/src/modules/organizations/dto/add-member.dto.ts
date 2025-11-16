import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEnum, IsOptional, IsObject } from "class-validator";
import {
  OrganizationRole,
  MembershipStatus,
} from "../../../entities/user-organization.entity";

export class AddMemberDto {
  @ApiProperty({ description: "사용자 ID" })
  @IsNotEmpty({ message: "사용자 ID는 필수입니다." })
  userId: string;

  @ApiProperty({ description: "조직 내 역할", enum: OrganizationRole })
  @IsEnum(OrganizationRole, { message: "유효한 조직 역할을 선택해주세요." })
  role: OrganizationRole;

  @ApiProperty({
    description: "멤버십 상태",
    enum: MembershipStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(MembershipStatus, { message: "유효한 멤버십 상태를 선택해주세요." })
  status?: MembershipStatus;

  @ApiProperty({ description: "상세 권한 설정", required: false })
  @IsOptional()
  @IsObject()
  permissions?: {
    canViewBudgets?: boolean;
    canCreateBudgets?: boolean;
    canApproveBudgets?: boolean;
    canViewSettlements?: boolean;
    canCreateSettlements?: boolean;
    canApproveSettlements?: boolean;
    canManageEvents?: boolean;
    canManageMembers?: boolean;
    canViewReports?: boolean;
    canExportData?: boolean;
    [key: string]: any;
  };
}
