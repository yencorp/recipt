import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { IsEnum, IsOptional, IsNotEmpty } from "class-validator";
import { User } from "./user.entity";
import { Organization } from "./organization.entity";

export enum OrganizationRole {
  ADMIN = "ADMIN", // 조직 관리자
  TREASURER = "TREASURER", // 회계
  ACCOUNTANT = "ACCOUNTANT", // 회계담당
  SECRETARY = "SECRETARY", // 총무
  MEMBER = "MEMBER", // 일반 회원
  OBSERVER = "OBSERVER", // 옵저버 (읽기 전용)
}

export enum MembershipStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
  RESIGNED = "RESIGNED",
}

@Entity("user_organizations")
@Unique(["userId", "organizationId"])
@Index("idx_user_organizations_user", ["userId"])
@Index("idx_user_organizations_organization", ["organizationId"])
@Index("idx_user_organizations_role", ["role"])
@Index("idx_user_organizations_status", ["status"])
@Index("idx_user_organizations_joined", ["joinedAt"])
export class UserOrganization {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  @IsNotEmpty({ message: "사용자 ID는 필수 입력 항목입니다." })
  userId: string;

  @Column({ type: "uuid", name: "organization_id" })
  @IsNotEmpty({ message: "조직 ID는 필수 입력 항목입니다." })
  organizationId: string;

  @Column({
    type: "enum",
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER,
    comment: "조직 내 역할",
  })
  @IsEnum(OrganizationRole, { message: "유효한 조직 역할을 선택해주세요." })
  role: OrganizationRole;

  @Column({
    type: "enum",
    enum: MembershipStatus,
    default: MembershipStatus.PENDING,
    comment: "멤버십 상태",
  })
  @IsEnum(MembershipStatus, { message: "유효한 멤버십 상태를 선택해주세요." })
  status: MembershipStatus;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "가입 일시",
  })
  joinedAt: Date;

  @Column({ type: "timestamp", nullable: true, comment: "역할 변경 일시" })
  roleChangedAt?: Date;

  @Column({ type: "timestamp", nullable: true, comment: "탈퇴 일시" })
  leftAt?: Date;

  @Column({ type: "uuid", nullable: true, comment: "초대한 사용자 ID" })
  invitedBy?: string;

  @Column({ type: "uuid", nullable: true, comment: "승인한 관리자 ID" })
  approvedBy?: string;

  @Column({ type: "timestamp", nullable: true, comment: "승인 일시" })
  approvedAt?: Date;

  @Column({ type: "jsonb", nullable: true, comment: "권한 설정" })
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

  @Column({ type: "text", nullable: true, comment: "메모" })
  @IsOptional()
  notes?: string;

  @Column({ type: "boolean", default: true, comment: "활성 상태" })
  isActive: boolean;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "관계 생성 시간",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "마지막 수정 시간",
  })
  updatedAt: Date;

  // 관계 설정
  @ManyToOne(() => User, (user) => user.userOrganizations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(
    () => Organization,
    (organization) => organization.userOrganizations,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  // 가상 속성
  get isAdmin(): boolean {
    return this.role === OrganizationRole.ADMIN;
  }

  get canManageBudgets(): boolean {
    return (
      this.isAdmin ||
      this.role === OrganizationRole.TREASURER ||
      this.role === OrganizationRole.ACCOUNTANT
    );
  }

  get canApproveTransactions(): boolean {
    return this.isAdmin || this.role === OrganizationRole.TREASURER;
  }

  get isActiveMember(): boolean {
    return this.isActive && this.status === MembershipStatus.ACTIVE;
  }

  get membershipDuration(): number {
    if (this.leftAt) {
      return this.leftAt.getTime() - this.joinedAt.getTime();
    }
    return Date.now() - this.joinedAt.getTime();
  }

  // 비즈니스 메서드
  activate(): void {
    this.status = MembershipStatus.ACTIVE;
    this.isActive = true;
    if (!this.approvedAt) {
      this.approvedAt = new Date();
    }
  }

  deactivate(): void {
    this.status = MembershipStatus.INACTIVE;
    this.isActive = false;
  }

  suspend(): void {
    this.status = MembershipStatus.SUSPENDED;
  }

  resign(): void {
    this.status = MembershipStatus.RESIGNED;
    this.leftAt = new Date();
    this.isActive = false;
  }

  changeRole(newRole: OrganizationRole, _changedBy?: string): void {
    if (this.role !== newRole) {
      this.role = newRole;
      this.roleChangedAt = new Date();

      // 역할 변경시 권한 재설정
      this.updatePermissionsForRole(newRole);
    }
  }

  approve(approvedBy: string): void {
    this.status = MembershipStatus.ACTIVE;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.isActive = true;
  }

  updatePermissions(
    newPermissions: Partial<UserOrganization["permissions"]>
  ): void {
    this.permissions = {
      ...this.permissions,
      ...newPermissions,
    };
  }

  private updatePermissionsForRole(role: OrganizationRole): void {
    const rolePermissions = {
      [OrganizationRole.ADMIN]: {
        canViewBudgets: true,
        canCreateBudgets: true,
        canApproveBudgets: true,
        canViewSettlements: true,
        canCreateSettlements: true,
        canApproveSettlements: true,
        canManageEvents: true,
        canManageMembers: true,
        canViewReports: true,
        canExportData: true,
      },
      [OrganizationRole.TREASURER]: {
        canViewBudgets: true,
        canCreateBudgets: true,
        canApproveBudgets: true,
        canViewSettlements: true,
        canCreateSettlements: true,
        canApproveSettlements: true,
        canManageEvents: false,
        canManageMembers: false,
        canViewReports: true,
        canExportData: true,
      },
      [OrganizationRole.ACCOUNTANT]: {
        canViewBudgets: true,
        canCreateBudgets: true,
        canApproveBudgets: false,
        canViewSettlements: true,
        canCreateSettlements: true,
        canApproveSettlements: false,
        canManageEvents: false,
        canManageMembers: false,
        canViewReports: true,
        canExportData: false,
      },
      [OrganizationRole.SECRETARY]: {
        canViewBudgets: true,
        canCreateBudgets: false,
        canApproveBudgets: false,
        canViewSettlements: true,
        canCreateSettlements: false,
        canApproveSettlements: false,
        canManageEvents: true,
        canManageMembers: false,
        canViewReports: true,
        canExportData: false,
      },
      [OrganizationRole.MEMBER]: {
        canViewBudgets: true,
        canCreateBudgets: false,
        canApproveBudgets: false,
        canViewSettlements: true,
        canCreateSettlements: false,
        canApproveSettlements: false,
        canManageEvents: false,
        canManageMembers: false,
        canViewReports: false,
        canExportData: false,
      },
      [OrganizationRole.OBSERVER]: {
        canViewBudgets: true,
        canCreateBudgets: false,
        canApproveBudgets: false,
        canViewSettlements: true,
        canCreateSettlements: false,
        canApproveSettlements: false,
        canManageEvents: false,
        canManageMembers: false,
        canViewReports: false,
        canExportData: false,
      },
    };

    this.updatePermissions(rolePermissions[role]);
  }

  getRoleDisplayName(): string {
    const roleNames = {
      [OrganizationRole.ADMIN]: "관리자",
      [OrganizationRole.TREASURER]: "회계",
      [OrganizationRole.ACCOUNTANT]: "회계담당",
      [OrganizationRole.SECRETARY]: "총무",
      [OrganizationRole.MEMBER]: "일반회원",
      [OrganizationRole.OBSERVER]: "옵저버",
    };
    return roleNames[this.role] || this.role;
  }

  getStatusDisplayName(): string {
    const statusNames = {
      [MembershipStatus.ACTIVE]: "활성",
      [MembershipStatus.INACTIVE]: "비활성",
      [MembershipStatus.PENDING]: "승인대기",
      [MembershipStatus.SUSPENDED]: "정지",
      [MembershipStatus.RESIGNED]: "탈퇴",
    };
    return statusNames[this.status] || this.status;
  }
}
