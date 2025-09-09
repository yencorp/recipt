import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import {
  IsNotEmpty,
  Length,
  IsEnum,
  IsOptional,
  IsDecimal,
  Min,
  IsDate,
  IsInt,
} from "class-validator";
import { Organization } from "./organization.entity";
import { Event } from "./event.entity";
import { Budget } from "./budget.entity";
import { SettlementItem } from "./settlement-item.entity";

export enum SettlementType {
  EVENT = "EVENT", // 행사 결산
  MONTHLY = "MONTHLY", // 월간 결산
  QUARTERLY = "QUARTERLY", // 분기 결산
  ANNUAL = "ANNUAL", // 연간 결산
  PROJECT = "PROJECT", // 프로젝트 결산
  SPECIAL = "SPECIAL", // 특별 결산
}

export enum SettlementStatus {
  DRAFT = "DRAFT", // 작성중
  SUBMITTED = "SUBMITTED", // 제출됨
  UNDER_REVIEW = "UNDER_REVIEW", // 검토중
  APPROVED = "APPROVED", // 승인됨
  REJECTED = "REJECTED", // 반려됨
  FINAL = "FINAL", // 확정
  ARCHIVED = "ARCHIVED", // 보관됨
}

export enum ApprovalLevel {
  NONE = "NONE", // 승인 불필요
  TREASURER = "TREASURER", // 회계 승인
  ADMIN = "ADMIN", // 관리자 승인
  BOARD = "BOARD", // 이사회 승인
  ASSEMBLY = "ASSEMBLY", // 총회 승인
}

@Entity("settlements")
@Index("idx_settlements_organization", ["organizationId"])
@Index("idx_settlements_event", ["eventId"])
@Index("idx_settlements_budget", ["budgetId"])
@Index("idx_settlements_type", ["type"])
@Index("idx_settlements_status", ["status"])
@Index("idx_settlements_period", ["settlementYear", "settlementMonth"])
@Index("idx_settlements_approval", ["approvalLevel"])
@Index("idx_settlements_title_search", ["title"])
export class Settlement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "organization_id" })
  @IsNotEmpty({ message: "조직 ID는 필수 입력 항목입니다." })
  organizationId: string;

  @Column({
    type: "uuid",
    nullable: true,
    name: "event_id",
    comment: "연관 행사 ID",
  })
  @IsOptional()
  eventId?: string;

  @Column({
    type: "uuid",
    nullable: true,
    name: "budget_id",
    comment: "연관 예산 ID",
  })
  @IsOptional()
  budgetId?: string;

  @Column({ type: "uuid", name: "created_by", comment: "결산 작성자" })
  @IsNotEmpty({ message: "작성자 ID는 필수 입력 항목입니다." })
  createdBy: string;

  @Column({
    type: "uuid",
    nullable: true,
    name: "reviewed_by",
    comment: "검토자",
  })
  reviewedBy?: string;

  @Column({
    type: "uuid",
    nullable: true,
    name: "approved_by",
    comment: "승인자",
  })
  approvedBy?: string;

  @Column({ type: "varchar", length: 200, comment: "결산 제목" })
  @IsNotEmpty({ message: "결산 제목은 필수 입력 항목입니다." })
  @Length(2, 200, {
    message: "결산 제목은 2자 이상 200자 이하로 입력해주세요.",
  })
  title: string;

  @Column({ type: "text", nullable: true, comment: "결산 설명" })
  @IsOptional()
  description?: string;

  @Column({
    type: "enum",
    enum: SettlementType,
    comment: "결산 유형",
  })
  @IsEnum(SettlementType, { message: "유효한 결산 유형을 선택해주세요." })
  type: SettlementType;

  @Column({
    type: "enum",
    enum: SettlementStatus,
    default: SettlementStatus.DRAFT,
    comment: "결산 상태",
  })
  @IsEnum(SettlementStatus, { message: "유효한 결산 상태를 선택해주세요." })
  status: SettlementStatus;

  @Column({
    type: "enum",
    enum: ApprovalLevel,
    default: ApprovalLevel.TREASURER,
    comment: "필요 승인 수준",
  })
  @IsEnum(ApprovalLevel, { message: "유효한 승인 수준을 선택해주세요." })
  approvalLevel: ApprovalLevel;

  @Column({ type: "integer", comment: "결산 연도" })
  @IsNotEmpty({ message: "결산 연도는 필수 입력 항목입니다." })
  @IsInt({ message: "결산 연도는 정수여야 합니다." })
  @Min(2020, { message: "결산 연도는 2020년 이상이어야 합니다." })
  settlementYear: number;

  @Column({
    type: "integer",
    nullable: true,
    comment: "결산 월 (1-12, 월간 결산시)",
  })
  @IsOptional()
  @IsInt({ message: "결산 월은 정수여야 합니다." })
  @Min(1, { message: "결산 월은 1 이상이어야 합니다." })
  settlementMonth?: number;

  @Column({ type: "date", comment: "결산 기간 시작일" })
  @IsNotEmpty({ message: "결산 시작일은 필수 입력 항목입니다." })
  @IsDate({ message: "유효한 시작일을 입력해주세요." })
  periodStartDate: Date;

  @Column({ type: "date", comment: "결산 기간 종료일" })
  @IsNotEmpty({ message: "결산 종료일은 필수 입력 항목입니다." })
  @IsDate({ message: "유효한 종료일을 입력해주세요." })
  periodEndDate: Date;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "총 수입 금액",
  })
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 수입 금액을 입력해주세요." }
  )
  @Min(0, { message: "수입 금액은 0 이상이어야 합니다." })
  totalIncomeAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "총 지출 금액",
  })
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 지출 금액을 입력해주세요." }
  )
  @Min(0, { message: "지출 금액은 0 이상이어야 합니다." })
  totalExpenseAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "순 결산 금액 (수입 - 지출)",
  })
  netAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "예산 대비 수입 차이",
  })
  incomeVariance: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "예산 대비 지출 차이",
  })
  expenseVariance: number;

  @Column({ type: "varchar", length: 3, default: "KRW" })
  currency: string;

  @Column({ type: "timestamp", nullable: true, comment: "제출 시간" })
  submittedAt?: Date;

  @Column({ type: "timestamp", nullable: true, comment: "검토 시간" })
  reviewedAt?: Date;

  @Column({ type: "timestamp", nullable: true, comment: "승인 시간" })
  approvedAt?: Date;

  @Column({ type: "timestamp", nullable: true, comment: "확정 시간" })
  finalizedAt?: Date;

  @Column({ type: "text", nullable: true, comment: "검토 의견" })
  @IsOptional()
  reviewNotes?: string;

  @Column({ type: "text", nullable: true, comment: "승인/반려 의견" })
  @IsOptional()
  approvalNotes?: string;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
    comment: "첨부파일 경로",
  })
  @IsOptional()
  attachmentPath?: string;

  @Column({ type: "jsonb", nullable: true, comment: "결산 통계 정보" })
  statistics?: {
    receiptCount?: number;
    validatedReceiptCount?: number;
    ocrProcessedCount?: number;
    manualEntryCount?: number;
    categoryBreakdown?: Record<string, number>;
    monthlyBreakdown?: Record<string, number>;
    vendorBreakdown?: Record<string, number>;
    averageExpenseAmount?: number;
    largestExpense?: { amount: number; description: string };
    discrepancies?: Array<{
      type: string;
      description: string;
      amount?: number;
    }>;
    [key: string]: any;
  };

  @Column({ type: "jsonb", nullable: true, comment: "결산 메타데이터" })
  metadata?: {
    tags?: string[];
    categories?: string[];
    priority?: "HIGH" | "MEDIUM" | "LOW";
    confidentialityLevel?:
      | "PUBLIC"
      | "INTERNAL"
      | "CONFIDENTIAL"
      | "RESTRICTED";
    auditRequired?: boolean;
    externalAuditor?: string;
    complianceChecks?: string[];
    [key: string]: any;
  };

  @Column({ type: "text", nullable: true, comment: "특이사항 및 메모" })
  @IsOptional()
  notes?: string;

  @Column({ type: "integer", default: 1, comment: "결산 버전" })
  version: number;

  @Column({ type: "boolean", default: false, comment: "최종 확정 여부" })
  isFinal: boolean;

  @Column({ type: "boolean", default: false, comment: "감사 완료 여부" })
  isAudited: boolean;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "결산 생성 시간",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "마지막 수정 시간",
  })
  updatedAt: Date;

  // 관계 설정
  @ManyToOne(() => Organization, (organization) => organization.settlements, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  @ManyToOne(() => Event, (event) => event.settlements, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "event_id" })
  event?: Event;

  @ManyToOne(() => Budget, (budget) => budget.settlements, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "budget_id" })
  budget?: Budget;

  @OneToMany(() => SettlementItem, (item) => item.settlement, {
    cascade: true,
  })
  items: SettlementItem[];

  // 가상 속성
  get netAmountCalculated(): number {
    return this.totalIncomeAmount - this.totalExpenseAmount;
  }

  get isOverBudget(): boolean {
    return this.expenseVariance > 0;
  }

  get isUnderBudget(): boolean {
    return this.expenseVariance < 0;
  }

  get incomeAchievementRate(): number {
    if (this.incomeVariance === 0) return 100;
    const budgetIncome = this.totalIncomeAmount - this.incomeVariance;
    if (budgetIncome === 0) return 0;
    return (this.totalIncomeAmount / budgetIncome) * 100;
  }

  get expenseUtilizationRate(): number {
    if (this.expenseVariance === 0) return 100;
    const budgetExpense = this.totalExpenseAmount - this.expenseVariance;
    if (budgetExpense === 0) return 0;
    return (this.totalExpenseAmount / budgetExpense) * 100;
  }

  get canBeModified(): boolean {
    return [SettlementStatus.DRAFT, SettlementStatus.REJECTED].includes(
      this.status
    );
  }

  get canBeSubmitted(): boolean {
    return this.status === SettlementStatus.DRAFT && this.items?.length > 0;
  }

  get canBeApproved(): boolean {
    return this.status === SettlementStatus.UNDER_REVIEW;
  }

  get durationInDays(): number {
    return Math.ceil(
      (this.periodEndDate.getTime() - this.periodStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  // 비즈니스 메서드
  submit(): void {
    if (this.canBeSubmitted) {
      this.status = SettlementStatus.SUBMITTED;
      this.submittedAt = new Date();
    }
  }

  review(reviewedBy: string, notes?: string): void {
    this.status = SettlementStatus.UNDER_REVIEW;
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    if (notes) this.reviewNotes = notes;
  }

  approve(approvedBy: string, notes?: string): void {
    if (this.canBeApproved) {
      this.status = SettlementStatus.APPROVED;
      this.approvedBy = approvedBy;
      this.approvedAt = new Date();
      if (notes) this.approvalNotes = notes;
    }
  }

  reject(rejectedBy: string, reason?: string): void {
    if (this.canBeApproved) {
      this.status = SettlementStatus.REJECTED;
      this.approvedBy = rejectedBy;
      this.approvedAt = new Date();
      if (reason) this.approvalNotes = reason;
    }
  }

  finalize(): void {
    if (this.status === SettlementStatus.APPROVED) {
      this.status = SettlementStatus.FINAL;
      this.isFinal = true;
      this.finalizedAt = new Date();
      this.calculateFinalAmounts();
    }
  }

  archive(): void {
    this.status = SettlementStatus.ARCHIVED;
  }

  private calculateFinalAmounts(): void {
    // 결산 항목들의 실제 금액 합계 계산
    if (this.items?.length) {
      this.totalIncomeAmount = this.items
        .filter((item) => item.type === "INCOME")
        .reduce((sum, item) => sum + item.actualAmount, 0);

      this.totalExpenseAmount = this.items
        .filter((item) => item.type === "EXPENSE")
        .reduce((sum, item) => sum + item.actualAmount, 0);
    }

    this.netAmount = this.netAmountCalculated;
  }

  updateStatistics(): void {
    if (!this.items?.length) return;

    const receiptItems = this.items.filter((item) => item.receiptScanId);
    const ocrProcessedItems = this.items.filter((item) => item.ocrResultId);
    const manualItems = this.items.filter((item) => !item.receiptScanId);

    // 카테고리별 통계
    const categoryBreakdown: Record<string, number> = {};
    this.items.forEach((item) => {
      if (item.category) {
        categoryBreakdown[item.category] =
          (categoryBreakdown[item.category] || 0) + item.actualAmount;
      }
    });

    // 월별 통계
    const monthlyBreakdown: Record<string, number> = {};
    this.items.forEach((item) => {
      if (item.transactionDate) {
        const month = item.transactionDate.toISOString().substring(0, 7);
        monthlyBreakdown[month] =
          (monthlyBreakdown[month] || 0) + item.actualAmount;
      }
    });

    // 공급업체별 통계
    const vendorBreakdown: Record<string, number> = {};
    this.items.forEach((item) => {
      if (item.vendor) {
        vendorBreakdown[item.vendor] =
          (vendorBreakdown[item.vendor] || 0) + item.actualAmount;
      }
    });

    // 가장 큰 지출
    const expenseItems = this.items.filter((item) => item.type === "EXPENSE");
    const largestExpense = expenseItems.reduce(
      (max, item) => (item.actualAmount > max.actualAmount ? item : max),
      expenseItems[0]
    );

    this.statistics = {
      receiptCount: receiptItems.length,
      validatedReceiptCount: receiptItems.filter((item) => item.isValidated)
        .length,
      ocrProcessedCount: ocrProcessedItems.length,
      manualEntryCount: manualItems.length,
      categoryBreakdown,
      monthlyBreakdown,
      vendorBreakdown,
      averageExpenseAmount:
        expenseItems.length > 0
          ? expenseItems.reduce((sum, item) => sum + item.actualAmount, 0) /
            expenseItems.length
          : 0,
      largestExpense: largestExpense
        ? {
            amount: largestExpense.actualAmount,
            description: largestExpense.description || largestExpense.itemName,
          }
        : undefined,
    };
  }

  updateMetadata(newMetadata: Partial<Settlement["metadata"]>): void {
    this.metadata = {
      ...this.metadata,
      ...newMetadata,
    };
  }

  incrementVersion(): void {
    this.version += 1;
  }

  getTypeDisplayName(): string {
    const typeNames = {
      [SettlementType.EVENT]: "행사 결산",
      [SettlementType.MONTHLY]: "월간 결산",
      [SettlementType.QUARTERLY]: "분기 결산",
      [SettlementType.ANNUAL]: "연간 결산",
      [SettlementType.PROJECT]: "프로젝트 결산",
      [SettlementType.SPECIAL]: "특별 결산",
    };
    return typeNames[this.type] || this.type;
  }

  getStatusDisplayName(): string {
    const statusNames = {
      [SettlementStatus.DRAFT]: "작성중",
      [SettlementStatus.SUBMITTED]: "제출됨",
      [SettlementStatus.UNDER_REVIEW]: "검토중",
      [SettlementStatus.APPROVED]: "승인됨",
      [SettlementStatus.REJECTED]: "반려됨",
      [SettlementStatus.FINAL]: "확정",
      [SettlementStatus.ARCHIVED]: "보관됨",
    };
    return statusNames[this.status] || this.status;
  }

  getApprovalLevelDisplayName(): string {
    const approvalNames = {
      [ApprovalLevel.NONE]: "승인 불필요",
      [ApprovalLevel.TREASURER]: "회계 승인",
      [ApprovalLevel.ADMIN]: "관리자 승인",
      [ApprovalLevel.BOARD]: "이사회 승인",
      [ApprovalLevel.ASSEMBLY]: "총회 승인",
    };
    return approvalNames[this.approvalLevel] || this.approvalLevel;
  }
}
