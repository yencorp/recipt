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
  IsEmail,
  IsNotEmpty,
  Length,
  IsEnum,
  IsOptional,
} from "class-validator";
import { Exclude } from "class-transformer";
import { UserOrganization } from "./user-organization.entity";
import { ReceiptScan } from "./receipt-scan.entity";
import { Post } from "./post.entity";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN",
  TREASURER = "TREASURER",
  ACCOUNTANT = "ACCOUNTANT",
  MEMBER = "MEMBER",
  GUEST = "GUEST",
}

@Entity("users")
@Index("idx_users_email", ["email"])
@Index("idx_users_status", ["status"])
@Index("idx_users_role", ["role"])
@Index("idx_users_last_login", ["lastLoginAt"])
@Index("idx_users_name_search", ["name"], { where: "name IS NOT NULL" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  @IsEmail({}, { message: "유효한 이메일 주소를 입력해주세요." })
  @IsNotEmpty({ message: "이메일은 필수 입력 항목입니다." })
  @Index("idx_users_email_unique")
  email: string;

  @Column({ type: "varchar", length: 255 })
  @Exclude({ toPlainOnly: true })
  passwordHash: string;

  @Column({ type: "varchar", length: 50 })
  @IsNotEmpty({ message: "이름은 필수 입력 항목입니다." })
  @Length(2, 50, { message: "이름은 2자 이상 50자 이하로 입력해주세요." })
  name: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  @Length(10, 20, { message: "전화번호는 10자 이상 20자 이하로 입력해주세요." })
  @IsOptional()
  phone?: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.MEMBER,
    comment: "사용자 기본 역할",
  })
  @IsEnum(UserRole, { message: "유효한 사용자 역할을 선택해주세요." })
  role: UserRole;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  @IsEnum(UserStatus, { message: "유효한 사용자 상태를 선택해주세요." })
  status: UserStatus;

  @Column({ type: "varchar", length: 500, nullable: true })
  profileImageUrl?: string;

  @Column({ type: "timestamp", nullable: true })
  lastLoginAt?: Date;

  @Column({ type: "inet", nullable: true, comment: "마지막 로그인 IP 주소" })
  lastLoginIp?: string;

  @Column({ type: "timestamp", nullable: true })
  emailVerifiedAt?: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  @Exclude({ toPlainOnly: true })
  emailVerificationToken?: string;

  @Column({ type: "timestamp", nullable: true })
  passwordResetTokenExpiresAt?: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  @Exclude({ toPlainOnly: true })
  passwordResetToken?: string;

  @Column({ type: "integer", default: 0, comment: "로그인 실패 횟수" })
  failedLoginAttempts: number;

  @Column({ type: "timestamp", nullable: true, comment: "계정 잠금 만료 시간" })
  lockedUntil?: Date;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "text", nullable: true, comment: "사용자 메모" })
  notes?: string;

  @Column({ type: "jsonb", nullable: true, comment: "추가 사용자 설정" })
  preferences?: Record<string, any>;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "계정 생성 시간",
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
    (userOrganization) => userOrganization.user
  )
  userOrganizations: UserOrganization[];

  @OneToMany(() => ReceiptScan, (receiptScan) => receiptScan.uploader)
  receiptScans: ReceiptScan[];

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  // 가상 속성
  get isEmailVerified(): boolean {
    return !!this.emailVerifiedAt;
  }

  get isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }

  get canLogin(): boolean {
    return (
      this.isActive &&
      this.status === UserStatus.ACTIVE &&
      !this.isLocked &&
      this.isEmailVerified
    );
  }

  // 비즈니스 메서드
  lockAccount(minutes: number = 30): void {
    this.lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
    this.failedLoginAttempts = 0;
  }

  unlockAccount(): void {
    this.lockedUntil = null;
    this.failedLoginAttempts = 0;
  }

  incrementFailedLoginAttempts(): void {
    this.failedLoginAttempts += 1;

    // 5회 실패시 30분 잠금
    if (this.failedLoginAttempts >= 5) {
      this.lockAccount(30);
    }
  }

  resetFailedLoginAttempts(): void {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }

  updateLastLogin(ip?: string): void {
    this.lastLoginAt = new Date();
    this.lastLoginIp = ip;
    this.resetFailedLoginAttempts();
  }

  verifyEmail(): void {
    this.emailVerifiedAt = new Date();
    this.emailVerificationToken = null;
    if (this.status === UserStatus.PENDING_VERIFICATION) {
      this.status = UserStatus.ACTIVE;
    }
  }
}
