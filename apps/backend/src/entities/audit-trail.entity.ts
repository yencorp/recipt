import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";
import {
  IsNotEmpty,
  Length,
  IsEnum,
  IsOptional,
  IsIP,
  IsUUID,
} from "class-validator";

export enum AuditAction {
  // User actions
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  USER_LOGIN_FAILED = "USER_LOGIN_FAILED",
  USER_PASSWORD_CHANGED = "USER_PASSWORD_CHANGED",
  USER_PROFILE_UPDATED = "USER_PROFILE_UPDATED",

  // Organization actions
  ORG_CREATED = "ORG_CREATED",
  ORG_UPDATED = "ORG_UPDATED",
  ORG_DELETED = "ORG_DELETED",
  ORG_MEMBER_ADDED = "ORG_MEMBER_ADDED",
  ORG_MEMBER_REMOVED = "ORG_MEMBER_REMOVED",
  ORG_ROLE_CHANGED = "ORG_ROLE_CHANGED",

  // Budget actions
  BUDGET_CREATED = "BUDGET_CREATED",
  BUDGET_UPDATED = "BUDGET_UPDATED",
  BUDGET_DELETED = "BUDGET_DELETED",
  BUDGET_SUBMITTED = "BUDGET_SUBMITTED",
  BUDGET_APPROVED = "BUDGET_APPROVED",
  BUDGET_REJECTED = "BUDGET_REJECTED",

  // Settlement actions
  SETTLEMENT_CREATED = "SETTLEMENT_CREATED",
  SETTLEMENT_UPDATED = "SETTLEMENT_UPDATED",
  SETTLEMENT_DELETED = "SETTLEMENT_DELETED",
  SETTLEMENT_SUBMITTED = "SETTLEMENT_SUBMITTED",
  SETTLEMENT_APPROVED = "SETTLEMENT_APPROVED",
  SETTLEMENT_REJECTED = "SETTLEMENT_REJECTED",
  SETTLEMENT_FINALIZED = "SETTLEMENT_FINALIZED",

  // Settlement item actions
  SETTLEMENT_ITEM_CREATED = "SETTLEMENT_ITEM_CREATED",
  SETTLEMENT_ITEM_UPDATED = "SETTLEMENT_ITEM_UPDATED",
  SETTLEMENT_ITEM_DELETED = "SETTLEMENT_ITEM_DELETED",
  SETTLEMENT_ITEM_VALIDATED = "SETTLEMENT_ITEM_VALIDATED",
  SETTLEMENT_ITEM_DISPUTED = "SETTLEMENT_ITEM_DISPUTED",

  // Receipt and OCR actions
  RECEIPT_UPLOADED = "RECEIPT_UPLOADED",
  RECEIPT_DELETED = "RECEIPT_DELETED",
  OCR_PROCESSED = "OCR_PROCESSED",
  OCR_CORRECTED = "OCR_CORRECTED",
  OCR_VALIDATED = "OCR_VALIDATED",

  // Data access actions
  DATA_EXPORTED = "DATA_EXPORTED",
  REPORT_GENERATED = "REPORT_GENERATED",
  DATA_IMPORTED = "DATA_IMPORTED",

  // Security actions
  PERMISSION_GRANTED = "PERMISSION_GRANTED",
  PERMISSION_REVOKED = "PERMISSION_REVOKED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",

  // System actions
  SYSTEM_BACKUP = "SYSTEM_BACKUP",
  SYSTEM_RESTORE = "SYSTEM_RESTORE",
  SYSTEM_MAINTENANCE = "SYSTEM_MAINTENANCE",
}

export enum AuditSeverity {
  INFO = "INFO", // 정보성 로그
  WARNING = "WARNING", // 경고
  ERROR = "ERROR", // 에러
  CRITICAL = "CRITICAL", // 심각한 문제
  SECURITY = "SECURITY", // 보안 관련
}

export enum AuditStatus {
  SUCCESS = "SUCCESS", // 성공
  FAILURE = "FAILURE", // 실패
  PARTIAL = "PARTIAL", // 부분 성공
  PENDING = "PENDING", // 진행중
}

@Entity("audit_trails")
@Index("idx_audit_trails_user", ["userId"])
@Index("idx_audit_trails_organization", ["organizationId"])
@Index("idx_audit_trails_action", ["action"])
@Index("idx_audit_trails_severity", ["severity"])
@Index("idx_audit_trails_status", ["status"])
@Index("idx_audit_trails_timestamp", ["timestamp"])
@Index("idx_audit_trails_entity", ["entityType", "entityId"])
@Index("idx_audit_trails_ip", ["ipAddress"])
@Index("idx_audit_trails_session", ["sessionId"])
export class AuditTrail {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "uuid",
    nullable: true,
    name: "user_id",
    comment: "작업 수행 사용자",
  })
  @IsOptional()
  @IsUUID(4, { message: "유효한 사용자 ID를 입력해주세요." })
  userId?: string;

  @Column({
    type: "uuid",
    nullable: true,
    name: "organization_id",
    comment: "연관 조직",
  })
  @IsOptional()
  @IsUUID(4, { message: "유효한 조직 ID를 입력해주세요." })
  organizationId?: string;

  @Column({ type: "varchar", length: 100, nullable: true, comment: "세션 ID" })
  @IsOptional()
  sessionId?: string;

  @Column({
    type: "enum",
    enum: AuditAction,
    comment: "수행된 작업",
  })
  @IsEnum(AuditAction, { message: "유효한 감사 작업을 선택해주세요." })
  action: AuditAction;

  @Column({
    type: "enum",
    enum: AuditSeverity,
    default: AuditSeverity.INFO,
    comment: "심각도",
  })
  @IsEnum(AuditSeverity, { message: "유효한 심각도를 선택해주세요." })
  severity: AuditSeverity;

  @Column({
    type: "enum",
    enum: AuditStatus,
    default: AuditStatus.SUCCESS,
    comment: "작업 상태",
  })
  @IsEnum(AuditStatus, { message: "유효한 상태를 선택해주세요." })
  status: AuditStatus;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "대상 엔티티 유형",
  })
  @IsOptional()
  entityType?: string;

  @Column({ type: "uuid", nullable: true, comment: "대상 엔티티 ID" })
  @IsOptional()
  @IsUUID(4, { message: "유효한 엔티티 ID를 입력해주세요." })
  entityId?: string;

  @Column({ type: "varchar", length: 200, comment: "작업 설명" })
  @IsNotEmpty({ message: "작업 설명은 필수 입력 항목입니다." })
  @Length(1, 200, {
    message: "작업 설명은 1자 이상 200자 이하로 입력해주세요.",
  })
  description: string;

  @Column({ type: "text", nullable: true, comment: "상세 내용" })
  @IsOptional()
  details?: string;

  @Column({ type: "inet", nullable: true, comment: "클라이언트 IP 주소" })
  @IsOptional()
  @IsIP(undefined, { message: "유효한 IP 주소를 입력해주세요." })
  ipAddress?: string;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
    comment: "사용자 에이전트",
  })
  @IsOptional()
  userAgent?: string;

  @Column({
    type: "varchar",
    length: 200,
    nullable: true,
    comment: "요청 경로",
  })
  @IsOptional()
  requestPath?: string;

  @Column({
    type: "varchar",
    length: 10,
    nullable: true,
    comment: "HTTP 메서드",
  })
  @IsOptional()
  httpMethod?: string;

  @Column({ type: "integer", nullable: true, comment: "HTTP 상태 코드" })
  @IsOptional()
  httpStatusCode?: number;

  @Column({ type: "integer", nullable: true, comment: "응답 시간 (ms)" })
  @IsOptional()
  responseTime?: number;

  @Column({ type: "jsonb", nullable: true, comment: "변경 전 데이터" })
  oldValues?: Record<string, any>;

  @Column({ type: "jsonb", nullable: true, comment: "변경 후 데이터" })
  newValues?: Record<string, any>;

  @Column({ type: "jsonb", nullable: true, comment: "추가 메타데이터" })
  metadata?: {
    correlationId?: string;
    requestId?: string;
    traceId?: string;
    tags?: string[];
    environment?: string;
    version?: string;
    component?: string;
    feature?: string;
    riskScore?: number;
    geolocation?: {
      country?: string;
      region?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
    device?: {
      type?: string;
      os?: string;
      browser?: string;
      version?: string;
    };
    [key: string]: any;
  };

  @Column({ type: "text", nullable: true, comment: "에러 메시지" })
  @IsOptional()
  errorMessage?: string;

  @Column({ type: "text", nullable: true, comment: "스택 트레이스" })
  @IsOptional()
  stackTrace?: string;

  @Column({ type: "boolean", default: false, comment: "자동 생성 여부" })
  isSystemGenerated: boolean;

  @Column({ type: "boolean", default: false, comment: "보안 관련 여부" })
  isSecurityRelevant: boolean;

  @Column({ type: "boolean", default: false, comment: "규정 준수 관련 여부" })
  isComplianceRelevant: boolean;

  @Column({ type: "integer", default: 0, comment: "보존 기간 (일)" })
  retentionDays: number;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "작업 수행 시간",
  })
  timestamp: Date;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "레코드 생성 시간",
  })
  createdAt: Date;

  // 가상 속성
  get hasChanges(): boolean {
    return (
      (this.oldValues && Object.keys(this.oldValues).length > 0) ||
      (this.newValues && Object.keys(this.newValues).length > 0)
    );
  }

  get isHighRisk(): boolean {
    return (
      this.severity === AuditSeverity.CRITICAL ||
      this.severity === AuditSeverity.SECURITY ||
      this.isSecurityRelevant ||
      (this.metadata?.riskScore && this.metadata.riskScore > 0.8)
    );
  }

  get isFailure(): boolean {
    return this.status === AuditStatus.FAILURE;
  }

  get isUserAction(): boolean {
    return this.userId !== null && this.userId !== undefined;
  }

  get isSystemAction(): boolean {
    return this.isSystemGenerated || !this.isUserAction;
  }

  get timeSinceAction(): number {
    return Date.now() - this.timestamp.getTime();
  }

  get timeSinceActionInMinutes(): number {
    return Math.floor(this.timeSinceAction / (1000 * 60));
  }

  get timeSinceActionInHours(): number {
    return Math.floor(this.timeSinceAction / (1000 * 60 * 60));
  }

  get timeSinceActionInDays(): number {
    return Math.floor(this.timeSinceAction / (1000 * 60 * 60 * 24));
  }

  // 정적 메서드 - 감사 로그 생성
  static createUserActionLog(
    userId: string,
    action: AuditAction,
    description: string,
    options?: {
      organizationId?: string;
      entityType?: string;
      entityId?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      details?: string;
      severity?: AuditSeverity;
      metadata?: Record<string, any>;
    }
  ): Partial<AuditTrail> {
    return {
      userId,
      action,
      description,
      severity: options?.severity || AuditSeverity.INFO,
      status: AuditStatus.SUCCESS,
      organizationId: options?.organizationId,
      entityType: options?.entityType,
      entityId: options?.entityId,
      sessionId: options?.sessionId,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      oldValues: options?.oldValues,
      newValues: options?.newValues,
      details: options?.details,
      metadata: options?.metadata,
      isSystemGenerated: false,
      timestamp: new Date(),
    };
  }

  static createSystemActionLog(
    action: AuditAction,
    description: string,
    options?: {
      organizationId?: string;
      entityType?: string;
      entityId?: string;
      details?: string;
      severity?: AuditSeverity;
      status?: AuditStatus;
      errorMessage?: string;
      metadata?: Record<string, any>;
    }
  ): Partial<AuditTrail> {
    return {
      action,
      description,
      severity: options?.severity || AuditSeverity.INFO,
      status: options?.status || AuditStatus.SUCCESS,
      organizationId: options?.organizationId,
      entityType: options?.entityType,
      entityId: options?.entityId,
      details: options?.details,
      errorMessage: options?.errorMessage,
      metadata: options?.metadata,
      isSystemGenerated: true,
      timestamp: new Date(),
    };
  }

  static createSecurityLog(
    action: AuditAction,
    description: string,
    userId: string | null,
    options?: {
      organizationId?: string;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      details?: string;
      riskScore?: number;
      metadata?: Record<string, any>;
    }
  ): Partial<AuditTrail> {
    return {
      userId,
      action,
      description,
      severity: AuditSeverity.SECURITY,
      status: AuditStatus.SUCCESS,
      organizationId: options?.organizationId,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      sessionId: options?.sessionId,
      details: options?.details,
      metadata: {
        ...options?.metadata,
        riskScore: options?.riskScore || 0.8,
      },
      isSecurityRelevant: true,
      isSystemGenerated: false,
      timestamp: new Date(),
    };
  }

  // 비즈니스 메서드
  updateMetadata(newMetadata: Partial<AuditTrail["metadata"]>): void {
    this.metadata = {
      ...this.metadata,
      ...newMetadata,
    };
  }

  addTag(tag: string): void {
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.tags) this.metadata.tags = [];

    if (!this.metadata.tags.includes(tag)) {
      this.metadata.tags.push(tag);
    }
  }

  setRiskScore(score: number): void {
    if (!this.metadata) this.metadata = {};
    this.metadata.riskScore = Math.max(0, Math.min(1, score));

    if (score > 0.8) {
      this.severity = AuditSeverity.CRITICAL;
      this.isSecurityRelevant = true;
    }
  }

  markAsSecurityRelevant(): void {
    this.isSecurityRelevant = true;
    if (this.severity === AuditSeverity.INFO) {
      this.severity = AuditSeverity.SECURITY;
    }
  }

  markAsComplianceRelevant(): void {
    this.isComplianceRelevant = true;
    this.retentionDays = Math.max(this.retentionDays, 2555); // 최소 7년 보관
  }

  getActionDisplayName(): string {
    const actionNames: Record<AuditAction, string> = {
      [AuditAction.USER_LOGIN]: "사용자 로그인",
      [AuditAction.USER_LOGOUT]: "사용자 로그아웃",
      [AuditAction.USER_LOGIN_FAILED]: "로그인 실패",
      [AuditAction.USER_PASSWORD_CHANGED]: "비밀번호 변경",
      [AuditAction.USER_PROFILE_UPDATED]: "프로필 수정",
      [AuditAction.ORG_CREATED]: "조직 생성",
      [AuditAction.ORG_UPDATED]: "조직 수정",
      [AuditAction.ORG_DELETED]: "조직 삭제",
      [AuditAction.ORG_MEMBER_ADDED]: "조직 멤버 추가",
      [AuditAction.ORG_MEMBER_REMOVED]: "조직 멤버 제거",
      [AuditAction.ORG_ROLE_CHANGED]: "조직 역할 변경",
      [AuditAction.BUDGET_CREATED]: "예산 생성",
      [AuditAction.BUDGET_UPDATED]: "예산 수정",
      [AuditAction.BUDGET_DELETED]: "예산 삭제",
      [AuditAction.BUDGET_SUBMITTED]: "예산 제출",
      [AuditAction.BUDGET_APPROVED]: "예산 승인",
      [AuditAction.BUDGET_REJECTED]: "예산 반려",
      [AuditAction.SETTLEMENT_CREATED]: "결산 생성",
      [AuditAction.SETTLEMENT_UPDATED]: "결산 수정",
      [AuditAction.SETTLEMENT_DELETED]: "결산 삭제",
      [AuditAction.SETTLEMENT_SUBMITTED]: "결산 제출",
      [AuditAction.SETTLEMENT_APPROVED]: "결산 승인",
      [AuditAction.SETTLEMENT_REJECTED]: "결산 반려",
      [AuditAction.SETTLEMENT_FINALIZED]: "결산 확정",
      [AuditAction.SETTLEMENT_ITEM_CREATED]: "결산 항목 생성",
      [AuditAction.SETTLEMENT_ITEM_UPDATED]: "결산 항목 수정",
      [AuditAction.SETTLEMENT_ITEM_DELETED]: "결산 항목 삭제",
      [AuditAction.SETTLEMENT_ITEM_VALIDATED]: "결산 항목 검증",
      [AuditAction.SETTLEMENT_ITEM_DISPUTED]: "결산 항목 이의제기",
      [AuditAction.RECEIPT_UPLOADED]: "영수증 업로드",
      [AuditAction.RECEIPT_DELETED]: "영수증 삭제",
      [AuditAction.OCR_PROCESSED]: "OCR 처리",
      [AuditAction.OCR_CORRECTED]: "OCR 결과 수정",
      [AuditAction.OCR_VALIDATED]: "OCR 결과 검증",
      [AuditAction.DATA_EXPORTED]: "데이터 내보내기",
      [AuditAction.REPORT_GENERATED]: "보고서 생성",
      [AuditAction.DATA_IMPORTED]: "데이터 가져오기",
      [AuditAction.PERMISSION_GRANTED]: "권한 부여",
      [AuditAction.PERMISSION_REVOKED]: "권한 취소",
      [AuditAction.UNAUTHORIZED_ACCESS]: "무권한 접근",
      [AuditAction.SUSPICIOUS_ACTIVITY]: "의심스러운 활동",
      [AuditAction.SYSTEM_BACKUP]: "시스템 백업",
      [AuditAction.SYSTEM_RESTORE]: "시스템 복원",
      [AuditAction.SYSTEM_MAINTENANCE]: "시스템 유지보수",
    };
    return actionNames[this.action] || this.action;
  }

  getSeverityDisplayName(): string {
    const severityNames = {
      [AuditSeverity.INFO]: "정보",
      [AuditSeverity.WARNING]: "경고",
      [AuditSeverity.ERROR]: "오류",
      [AuditSeverity.CRITICAL]: "심각",
      [AuditSeverity.SECURITY]: "보안",
    };
    return severityNames[this.severity] || this.severity;
  }

  getStatusDisplayName(): string {
    const statusNames = {
      [AuditStatus.SUCCESS]: "성공",
      [AuditStatus.FAILURE]: "실패",
      [AuditStatus.PARTIAL]: "부분성공",
      [AuditStatus.PENDING]: "진행중",
    };
    return statusNames[this.status] || this.status;
  }
}
