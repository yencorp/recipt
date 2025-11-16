import { IsNotEmpty, IsEnum, IsOptional, IsObject } from "class-validator";
import {
  OrganizationRole,
  MembershipStatus,
} from "../../../entities/user-organization.entity";

export class AddMemberDto {
  @IsNotEmpty({ message: "사용자 ID는 필수입니다." })
  userId: string;

  @IsEnum(OrganizationRole, { message: "유효한 조직 역할을 선택해주세요." })
  role: OrganizationRole;

  @IsOptional()
  @IsEnum(MembershipStatus, { message: "유효한 멤버십 상태를 선택해주세요." })
  status?: MembershipStatus;

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
