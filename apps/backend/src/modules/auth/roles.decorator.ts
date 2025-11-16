import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../entities/user.entity";
import { OrganizationRole } from "../../entities/user-organization.entity";

export const ROLES_KEY = "roles";
export const ORG_ROLES_KEY = "orgRoles";

/**
 * 전역 사용자 역할을 요구하는 데코레이터
 * @param roles - 허용할 UserRole 배열
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * 단체 내 역할을 요구하는 데코레이터
 * @param roles - 허용할 OrganizationRole 배열
 */
export const OrgRoles = (...roles: OrganizationRole[]) =>
  SetMetadata(ORG_ROLES_KEY, roles);

/**
 * 관리자 권한을 요구하는 데코레이터
 * SUPER_ADMIN 또는 ORGANIZATION_ADMIN만 접근 가능
 */
export const AdminOnly = () =>
  SetMetadata(ROLES_KEY, [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN]);

/**
 * 단체 관리자 권한을 요구하는 데코레이터
 * 단체 내 ADMIN 역할을 가진 사용자만 접근 가능
 */
export const OrgAdminOnly = () =>
  SetMetadata(ORG_ROLES_KEY, [OrganizationRole.ADMIN]);
