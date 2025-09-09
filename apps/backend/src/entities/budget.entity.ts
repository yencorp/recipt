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
import { BudgetIncome } from "./budget-income.entity";
import { BudgetExpense } from "./budget-expense.entity";
import { Settlement } from "./settlement.entity";

export enum BudgetType {
  ANNUAL = "ANNUAL", // 연간 예산
  EVENT = "EVENT", // 행사 예산
  PROJECT = "PROJECT", // 프로젝트 예산
  SPECIAL = "SPECIAL", // 특별 예산
  EMERGENCY = "EMERGENCY", // 긴급 예산
  MONTHLY = "MONTHLY", // 월간 예산
  QUARTERLY = "QUARTERLY", // 분기별 예산
}

export enum BudgetStatus {
  DRAFT = "DRAFT", // 초안
  SUBMITTED = "SUBMITTED", // 제출됨
  UNDER_REVIEW = "UNDER_REVIEW", // 검토중
  APPROVED = "APPROVED", // 승인됨
  REJECTED = "REJECTED", // 반려됨
  ACTIVE = "ACTIVE", // 활성 (집행중)
  COMPLETED = "COMPLETED", // 완료
  CANCELLED = "CANCELLED", // 취소
}

export enum ApprovalStatus {
  PENDING = "PENDING", // 승인 대기
  APPROVED = "APPROVED", // 승인됨
  REJECTED = "REJECTED", // 반려됨
}

@Entity("budgets")
@Index("idx_budgets_organization", ["organizationId"])
@Index("idx_budgets_event", ["eventId"])
@Index("idx_budgets_type", ["type"])
@Index("idx_budgets_status", ["status"])
@Index("idx_budgets_year", ["budgetYear"])
@Index("idx_budgets_period", ["budgetPeriod"])
@Index("idx_budgets_approval", ["approvalStatus"])
@Index("idx_budgets_title_search", ["title"])
export class Budget {
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

  @Column({ type: "uuid", name: "created_by", comment: "예산 작성자" })
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

  @Column({ type: "varchar", length: 200, comment: "예산 제목" })
  @IsNotEmpty({ message: "예산 제목은 필수 입력 항목입니다." })
  @Length(2, 200, {
    message: "예산 제목은 2자 이상 200자 이하로 입력해주세요.",
  })
  title: string;

  @Column({ type: "text", nullable: true, comment: "예산 설명" })
  @IsOptional()
  description?: string;

  @Column({
    type: "enum",
    enum: BudgetType,
    comment: "예산 유형",
  })
  @IsEnum(BudgetType, { message: "유효한 예산 유형을 선택해주세요." })
  type: BudgetType;

  @Column({
    type: "enum",
    enum: BudgetStatus,
    default: BudgetStatus.DRAFT,
    comment: "예산 상태",
  })
  @IsEnum(BudgetStatus, { message: "유효한 예산 상태를 선택해주세요." })
  status: BudgetStatus;

  @Column({
    type: "enum",
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
    comment: "승인 상태",
  })
  @IsEnum(ApprovalStatus, { message: "유효한 승인 상태를 선택해주세요." })
  approvalStatus: ApprovalStatus;

  @Column({ type: "integer", comment: "예산 연도" })
  @IsNotEmpty({ message: "예산 연도는 필수 입력 항목입니다." })
  @IsInt({ message: "예산 연도는 정수여야 합니다." })
  @Min(2020, { message: "예산 연도는 2020년 이상이어야 합니다." })
  budgetYear: number;

  @Column({
    type: "integer",
    nullable: true,
    comment: "예산 기간 (월: 1-12, 분기: 1-4)",
  })
  @IsOptional()
  @IsInt({ message: "예산 기간은 정수여야 합니다." })
  @Min(1, { message: "예산 기간은 1 이상이어야 합니다." })
  budgetPeriod?: number;

  @Column({ type: "date", comment: "예산 기간 시작일" })
  @IsNotEmpty({ message: "예산 시작일은 필수 입력 항목입니다." })
  @IsDate({ message: "유효한 시작일을 입력해주세요." })
  periodStartDate: Date;

  @Column({ type: "date", comment: "예산 기간 종료일" })
  @IsNotEmpty({ message: "예산 종료일은 필수 입력 항목입니다." })
  @IsDate({ message: "유효한 종료일을 입력해주세요." })
  periodEndDate: Date;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "총 수입 예산",
  })
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 수입 예산을 입력해주세요." }
  )
  @Min(0, { message: "수입 예산은 0 이상이어야 합니다." })
  totalIncomeAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "총 지출 예산",
  })
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 지출 예산을 입력해주세요." }
  )
  @Min(0, { message: "지출 예산은 0 이상이어야 합니다." })
  totalExpenseAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "총 실제 수입",
  })
  totalActualIncome: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "총 실제 지출",
  })
  totalActualExpense: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "잔여 금액 (수입 - 지출)",
  })
  remainingAmount: number;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    comment: "예산 집행률 (%)",
  })
  executionRate?: number;

  @Column({ type: "varchar", length: 3, default: "KRW" })
  currency: string;

  @Column({ type: "timestamp", nullable: true, comment: "제출 시간" })
  submittedAt?: Date;

  @Column({ type: "timestamp", nullable: true, comment: "검토 시간" })
  reviewedAt?: Date;

  @Column({ type: "timestamp", nullable: true, comment: "승인 시간" })
  approvedAt?: Date;

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

  @Column({ type: "jsonb", nullable: true, comment: "예산 메타데이터" })
  metadata?: {
    tags?: string[];
    categories?: string[];
    priority?: "HIGH" | "MEDIUM" | "LOW";
    requiresApproval?: boolean;
    approvalThreshold?: number;
    notifications?: {
      onSubmit?: string[];
      onApproval?: string[];
      onRejection?: string[];
    };
    [key: string]: any;
  };

  @Column({ type: "text", nullable: true, comment: "특이사항 및 메모" })
  @IsOptional()
  notes?: string;

  @Column({ type: "integer", default: 1, comment: "예산 버전" })
  version: number;

  @Column({ type: "boolean", default: false, comment: "최종 확정 여부" })
  isFinal: boolean;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "예산 생성 시간",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "마지막 수정 시간",
  })
  updatedAt: Date;

  // 관계 설정
  @ManyToOne(() => Organization, (organization) => organization.budgets, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  @ManyToOne(() => Event, (event) => event.budgets, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "event_id" })
  event?: Event;

  @OneToMany(() => BudgetIncome, (income) => income.budget, {
    cascade: true,
  })
  incomes: BudgetIncome[];

  @OneToMany(() => BudgetExpense, (expense) => expense.budget, {
    cascade: true,
  })
  expenses: BudgetExpense[];

  @OneToMany(() => Settlement, (settlement) => settlement.budget)
  settlements: Settlement[];

  // 가상 속성
  get netAmount(): number {
    return this.totalIncomeAmount - this.totalExpenseAmount;
  }

  get actualNetAmount(): number {
    return this.totalActualIncome - this.totalActualExpense;
  }

  get budgetVariance(): number {
    return this.actualNetAmount - this.netAmount;
  }

  get incomeVariance(): number {
    return this.totalActualIncome - this.totalIncomeAmount;
  }

  get expenseVariance(): number {
    return this.totalActualExpense - this.totalExpenseAmount;
  }

  get isOverBudget(): boolean {
    return this.totalActualExpense > this.totalExpenseAmount;
  }

  get isUnderBudget(): boolean {
    return this.totalActualExpense < this.totalExpenseAmount;
  }

  get canBeModified(): boolean {
    return [BudgetStatus.DRAFT, BudgetStatus.REJECTED].includes(this.status);
  }

  get canBeSubmitted(): boolean {
    return (
      this.status === BudgetStatus.DRAFT &&
      this.totalIncomeAmount > 0 &&
      this.totalExpenseAmount > 0
    );
  }

  get canBeApproved(): boolean {
    return this.status === BudgetStatus.UNDER_REVIEW;
  }

  // 비즈니스 메서드
  submit(): void {
    if (this.canBeSubmitted) {
      this.status = BudgetStatus.SUBMITTED;
      this.submittedAt = new Date();
    }
  }

  review(reviewedBy: string, notes?: string): void {
    this.status = BudgetStatus.UNDER_REVIEW;
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    if (notes) this.reviewNotes = notes;
  }

  approve(approvedBy: string, notes?: string): void {
    if (this.canBeApproved) {
      this.status = BudgetStatus.APPROVED;
      this.approvalStatus = ApprovalStatus.APPROVED;
      this.approvedBy = approvedBy;
      this.approvedAt = new Date();
      if (notes) this.approvalNotes = notes;
    }
  }

  reject(rejectedBy: string, reason?: string): void {
    if (this.canBeApproved) {
      this.status = BudgetStatus.REJECTED;
      this.approvalStatus = ApprovalStatus.REJECTED;
      this.approvedBy = rejectedBy;
      this.approvedAt = new Date();
      if (reason) this.approvalNotes = reason;
    }
  }

  activate(): void {
    if (this.status === BudgetStatus.APPROVED) {
      this.status = BudgetStatus.ACTIVE;
    }
  }

  complete(): void {
    this.status = BudgetStatus.COMPLETED;
    this.calculateFinalAmounts();
  }

  cancel(): void {
    this.status = BudgetStatus.CANCELLED;
  }

  updateAmounts(): void {
    // 실제 수입/지출 합계 계산
    this.totalActualIncome =
      this.incomes?.reduce(
        (sum, income) => sum + (income.actualAmount || 0),
        0
      ) || 0;

    this.totalActualExpense =
      this.expenses?.reduce(
        (sum, expense) => sum + (expense.actualAmount || 0),
        0
      ) || 0;

    this.remainingAmount = this.totalActualIncome - this.totalActualExpense;

    // 집행률 계산
    if (this.totalExpenseAmount > 0) {
      this.executionRate =
        (this.totalActualExpense / this.totalExpenseAmount) * 100;
    }
  }

  private calculateFinalAmounts(): void {
    this.updateAmounts();
    this.isFinal = true;
  }

  updateMetadata(newMetadata: Partial<Budget["metadata"]>): void {
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
      [BudgetType.ANNUAL]: "연간 예산",
      [BudgetType.EVENT]: "행사 예산",
      [BudgetType.PROJECT]: "프로젝트 예산",
      [BudgetType.SPECIAL]: "특별 예산",
      [BudgetType.EMERGENCY]: "긴급 예산",
      [BudgetType.MONTHLY]: "월간 예산",
      [BudgetType.QUARTERLY]: "분기별 예산",
    };
    return typeNames[this.type] || this.type;
  }

  getStatusDisplayName(): string {
    const statusNames = {
      [BudgetStatus.DRAFT]: "초안",
      [BudgetStatus.SUBMITTED]: "제출됨",
      [BudgetStatus.UNDER_REVIEW]: "검토중",
      [BudgetStatus.APPROVED]: "승인됨",
      [BudgetStatus.REJECTED]: "반려됨",
      [BudgetStatus.ACTIVE]: "집행중",
      [BudgetStatus.COMPLETED]: "완료",
      [BudgetStatus.CANCELLED]: "취소",
    };
    return statusNames[this.status] || this.status;
  }
}
