import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import {
  IsNotEmpty,
  Length,
  IsEnum,
  IsOptional,
  IsEmail,
  IsUrl,
} from "class-validator";
import { UserOrganization } from "./user-organization.entity";
import { Event } from "./event.entity";
import { Budget } from "./budget.entity";
import { Settlement } from "./settlement.entity";
import { ReceiptScan } from "./receipt-scan.entity";

export enum OrganizationType {
  YOUTH_GROUP = "YOUTH_GROUP", // 청년회
  MOTHERS_GROUP = "MOTHERS_GROUP", // 자모회
  ELEMENTARY_SUNDAY_SCHOOL = "ELEMENTARY_SUNDAY_SCHOOL", // 초등부 주일학교
  YOUTH_SUNDAY_SCHOOL = "YOUTH_SUNDAY_SCHOOL", // 중고등부 주일학교
}

export enum OrganizationStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

@Entity("organizations")
@Index("idx_organizations_type", ["type"])
@Index("idx_organizations_status", ["status"])
@Index("idx_organizations_priority", ["priority"])
@Index("idx_organizations_name_search", ["name"])
export class Organization {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  @IsNotEmpty({ message: "조직명은 필수 입력 항목입니다." })
  @Length(2, 100, { message: "조직명은 2자 이상 100자 이하로 입력해주세요." })
  @Index("idx_organizations_name_unique")
  name: string;

  @Column({
    type: "enum",
    enum: OrganizationType,
    comment: "조직 유형",
  })
  @IsEnum(OrganizationType, { message: "유효한 조직 유형을 선택해주세요." })
  type: OrganizationType;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  description?: string;

  @Column({
    type: "enum",
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE,
  })
  @IsEnum(OrganizationStatus, { message: "유효한 조직 상태를 선택해주세요." })
  status: OrganizationStatus;

  @Column({
    type: "integer",
    default: 1,
    comment: "표시 우선순위 (낮을수록 상위)",
  })
  priority: number;

  @Column({
    type: "varchar",
    length: 10,
    default: "KRW",
    comment: "기본 화폐 단위",
  })
  defaultCurrency: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "대표자 이름",
  })
  @IsOptional()
  @Length(2, 100, {
    message: "대표자 이름은 2자 이상 100자 이하로 입력해주세요.",
  })
  representative?: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "연락처 이메일",
  })
  @IsOptional()
  @IsEmail({}, { message: "유효한 이메일 주소를 입력해주세요." })
  contactEmail?: string;

  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
    comment: "연락처 전화번호",
  })
  @IsOptional()
  contactPhone?: string;

  @Column({ type: "text", nullable: true, comment: "주소" })
  @IsOptional()
  address?: string;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
    comment: "웹사이트 URL",
  })
  @IsOptional()
  @IsUrl({}, { message: "유효한 URL을 입력해주세요." })
  websiteUrl?: string;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
    comment: "로고 이미지 URL",
  })
  @IsOptional()
  logoImageUrl?: string;

  @Column({ type: "jsonb", nullable: true, comment: "조직 설정" })
  settings?: {
    allowPublicBudgets?: boolean;
    requireReceiptApproval?: boolean;
    autoGenerateReports?: boolean;
    fiscalYearStart?: string; // MM-DD 형식
    budgetApprovalWorkflow?: boolean;
    [key: string]: any;
  };

  @Column({ type: "jsonb", nullable: true, comment: "조직 통계" })
  statistics?: {
    totalMembers?: number;
    totalEvents?: number;
    totalBudgets?: number;
    totalSettlements?: number;
    lastActivityAt?: Date;
    [key: string]: any;
  };

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "text", nullable: true, comment: "조직 메모" })
  notes?: string;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "조직 생성 시간",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "마지막 수정 시간",
  })
  updatedAt: Date;

  // 관계 설정
  @OneToMany(
    () => UserOrganization,
    (userOrganization) => userOrganization.organization
  )
  userOrganizations: UserOrganization[];

  @OneToMany(() => Event, (event) => event.organization)
  events: Event[];

  @OneToMany(() => Budget, (budget) => budget.organization)
  budgets: Budget[];

  @OneToMany(() => Settlement, (settlement) => settlement.organization)
  settlements: Settlement[];

  @OneToMany(() => ReceiptScan, (receiptScan) => receiptScan.organization)
  receiptScans: ReceiptScan[];

  // 가상 속성
  get isYouthGroup(): boolean {
    return this.type === OrganizationType.YOUTH_GROUP;
  }

  get isMothersGroup(): boolean {
    return this.type === OrganizationType.MOTHERS_GROUP;
  }

  get isSundaySchool(): boolean {
    return (
      this.type === OrganizationType.ELEMENTARY_SUNDAY_SCHOOL ||
      this.type === OrganizationType.YOUTH_SUNDAY_SCHOOL
    );
  }

  get displayName(): string {
    return this.name;
  }

  get memberCount(): number {
    return this.statistics?.totalMembers || 0;
  }

  // 비즈니스 메서드
  updateStatistics(data: Partial<Organization["statistics"]>): void {
    this.statistics = {
      ...this.statistics,
      ...data,
      lastActivityAt: new Date(),
    };
  }

  incrementMemberCount(): void {
    this.updateStatistics({
      totalMembers: this.memberCount + 1,
    });
  }

  decrementMemberCount(): void {
    this.updateStatistics({
      totalMembers: Math.max(0, this.memberCount - 1),
    });
  }

  updateSettings(newSettings: Partial<Organization["settings"]>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
  }

  activate(): void {
    this.status = OrganizationStatus.ACTIVE;
    this.isActive = true;
  }

  deactivate(): void {
    this.status = OrganizationStatus.INACTIVE;
    this.isActive = false;
  }

  suspend(): void {
    this.status = OrganizationStatus.SUSPENDED;
  }

  getTypeDisplayName(): string {
    const typeNames = {
      [OrganizationType.YOUTH_GROUP]: "청년회",
      [OrganizationType.MOTHERS_GROUP]: "자모회",
      [OrganizationType.ELEMENTARY_SUNDAY_SCHOOL]: "초등부 주일학교",
      [OrganizationType.YOUTH_SUNDAY_SCHOOL]: "중고등부 주일학교",
    };
    return typeNames[this.type] || this.type;
  }
}
