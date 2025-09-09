import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
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
} from "class-validator";
import { Budget } from "./budget.entity";

export enum IncomeCategory {
  DONATION = "DONATION", // 후원금
  MEMBERSHIP_FEE = "MEMBERSHIP_FEE", // 회비
  FUNDRAISING = "FUNDRAISING", // 모금
  EVENT_INCOME = "EVENT_INCOME", // 행사 수입
  SPONSORSHIP = "SPONSORSHIP", // 스폰서십
  GRANT = "GRANT", // 보조금
  OFFERING = "OFFERING", // 헌금
  SALE = "SALE", // 판매 수입
  INTEREST = "INTEREST", // 이자 수입
  RENT = "RENT", // 임대 수입
  OTHER = "OTHER", // 기타
}

export enum IncomeStatus {
  PLANNED = "PLANNED", // 계획됨
  EXPECTED = "EXPECTED", // 예상됨
  CONFIRMED = "CONFIRMED", // 확정됨
  RECEIVED = "RECEIVED", // 수령완료
  PENDING = "PENDING", // 대기중
  CANCELLED = "CANCELLED", // 취소됨
  OVERDUE = "OVERDUE", // 연체
}

@Entity("budget_incomes")
@Index("idx_budget_incomes_budget", ["budgetId"])
@Index("idx_budget_incomes_category", ["category"])
@Index("idx_budget_incomes_status", ["status"])
@Index("idx_budget_incomes_expected_date", ["expectedDate"])
@Index("idx_budget_incomes_received_date", ["receivedDate"])
export class BudgetIncome {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "budget_id" })
  @IsNotEmpty({ message: "예산 ID는 필수 입력 항목입니다." })
  budgetId: string;

  @Column({ type: "varchar", length: 200, comment: "수입 항목명" })
  @IsNotEmpty({ message: "수입 항목명은 필수 입력 항목입니다." })
  @Length(2, 200, {
    message: "수입 항목명은 2자 이상 200자 이하로 입력해주세요.",
  })
  itemName: string;

  @Column({ type: "text", nullable: true, comment: "수입 설명" })
  @IsOptional()
  description?: string;

  @Column({
    type: "enum",
    enum: IncomeCategory,
    comment: "수입 카테고리",
  })
  @IsEnum(IncomeCategory, { message: "유효한 수입 카테고리를 선택해주세요." })
  category: IncomeCategory;

  @Column({
    type: "enum",
    enum: IncomeStatus,
    default: IncomeStatus.PLANNED,
    comment: "수입 상태",
  })
  @IsEnum(IncomeStatus, { message: "유효한 수입 상태를 선택해주세요." })
  status: IncomeStatus;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    comment: "예산 금액",
  })
  @IsNotEmpty({ message: "예산 금액은 필수 입력 항목입니다." })
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 예산 금액을 입력해주세요." }
  )
  @Min(0, { message: "예산 금액은 0 이상이어야 합니다." })
  budgetAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    comment: "실제 수입 금액",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 실제 금액을 입력해주세요." }
  )
  @Min(0, { message: "실제 금액은 0 이상이어야 합니다." })
  actualAmount?: number;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    comment: "완료율 (%)",
  })
  completionRate?: number;

  @Column({ type: "varchar", length: 3, default: "KRW" })
  currency: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "수입처/기부자",
  })
  @IsOptional()
  @Length(1, 100, { message: "수입처는 1자 이상 100자 이하로 입력해주세요." })
  source?: string;

  @Column({ type: "varchar", length: 100, nullable: true, comment: "담당자" })
  @IsOptional()
  responsiblePerson?: string;

  @Column({ type: "date", nullable: true, comment: "예상 수입일" })
  @IsOptional()
  @IsDate({ message: "유효한 예상 수입일을 입력해주세요." })
  expectedDate?: Date;

  @Column({ type: "date", nullable: true, comment: "실제 수입일" })
  @IsOptional()
  @IsDate({ message: "유효한 실제 수입일을 입력해주세요." })
  receivedDate?: Date;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "수입 방법 (현금/계좌이체/카드 등)",
  })
  @IsOptional()
  receiptMethod?: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "참조번호 (거래번호 등)",
  })
  @IsOptional()
  referenceNumber?: string;

  @Column({ type: "boolean", default: false, comment: "세금공제 가능 여부" })
  isTaxDeductible: boolean;

  @Column({ type: "boolean", default: false, comment: "정기 수입 여부" })
  isRecurring: boolean;

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
    comment: "정기 수입 주기 (monthly, quarterly, yearly)",
  })
  @IsOptional()
  recurringCycle?: string;

  @Column({ type: "integer", default: 1, comment: "표시 순서" })
  displayOrder: number;

  @Column({ type: "jsonb", nullable: true, comment: "추가 메타데이터" })
  metadata?: {
    tags?: string[];
    isConfidential?: boolean;
    requiresApproval?: boolean;
    approvalThreshold?: number;
    receiptRequired?: boolean;
    fundingSource?: string;
    restrictedUse?: boolean;
    restrictions?: string[];
    [key: string]: any;
  };

  @Column({ type: "text", nullable: true, comment: "메모" })
  @IsOptional()
  notes?: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "생성 시간",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "마지막 수정 시간",
  })
  updatedAt: Date;

  // 관계 설정
  @ManyToOne(() => Budget, (budget) => budget.incomes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "budget_id" })
  budget: Budget;

  // 가상 속성
  get variance(): number {
    if (this.actualAmount === null || this.actualAmount === undefined) {
      return 0;
    }
    return this.actualAmount - this.budgetAmount;
  }

  get variancePercentage(): number {
    if (this.budgetAmount === 0) return 0;
    return (this.variance / this.budgetAmount) * 100;
  }

  get isOverBudget(): boolean {
    return this.variance > 0;
  }

  get isUnderBudget(): boolean {
    return this.variance < 0;
  }

  get isOnTrack(): boolean {
    return Math.abs(this.variancePercentage) <= 10; // 10% 이내면 계획대로로 간주
  }

  get isReceived(): boolean {
    return this.status === IncomeStatus.RECEIVED;
  }

  get isOverdue(): boolean {
    if (!this.expectedDate || this.isReceived) return false;
    return this.expectedDate < new Date();
  }

  get daysSinceExpected(): number {
    if (!this.expectedDate) return 0;
    const now = new Date();
    const timeDiff = now.getTime() - this.expectedDate.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  get daysUntilExpected(): number {
    if (!this.expectedDate) return 0;
    const now = new Date();
    const timeDiff = this.expectedDate.getTime() - now.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  // 비즈니스 메서드
  markAsReceived(amount: number, receivedDate?: Date): void {
    this.actualAmount = amount;
    this.receivedDate = receivedDate || new Date();
    this.status = IncomeStatus.RECEIVED;
    this.updateCompletionRate();
  }

  updateActualAmount(amount: number): void {
    this.actualAmount = amount;
    this.updateCompletionRate();
    this.updateStatus();
  }

  private updateCompletionRate(): void {
    if (
      this.actualAmount !== null &&
      this.actualAmount !== undefined &&
      this.budgetAmount > 0
    ) {
      this.completionRate = Math.min(
        100,
        (this.actualAmount / this.budgetAmount) * 100
      );
    } else {
      this.completionRate = 0;
    }
  }

  private updateStatus(): void {
    if (this.actualAmount && this.actualAmount >= this.budgetAmount) {
      this.status = IncomeStatus.RECEIVED;
    } else if (this.actualAmount && this.actualAmount > 0) {
      this.status = IncomeStatus.CONFIRMED;
    } else if (this.isOverdue) {
      this.status = IncomeStatus.OVERDUE;
    }
  }

  confirm(): void {
    this.status = IncomeStatus.CONFIRMED;
  }

  cancel(): void {
    this.status = IncomeStatus.CANCELLED;
    this.actualAmount = 0;
    this.completionRate = 0;
  }

  setExpectedDate(date: Date): void {
    this.expectedDate = date;
    this.updateStatus();
  }

  updateMetadata(newMetadata: Partial<BudgetIncome["metadata"]>): void {
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

  removeTag(tag: string): void {
    if (this.metadata?.tags) {
      this.metadata.tags = this.metadata.tags.filter((t) => t !== tag);
    }
  }

  getCategoryDisplayName(): string {
    const categoryNames = {
      [IncomeCategory.DONATION]: "후원금",
      [IncomeCategory.MEMBERSHIP_FEE]: "회비",
      [IncomeCategory.FUNDRAISING]: "모금",
      [IncomeCategory.EVENT_INCOME]: "행사 수입",
      [IncomeCategory.SPONSORSHIP]: "스폰서십",
      [IncomeCategory.GRANT]: "보조금",
      [IncomeCategory.OFFERING]: "헌금",
      [IncomeCategory.SALE]: "판매 수입",
      [IncomeCategory.INTEREST]: "이자 수입",
      [IncomeCategory.RENT]: "임대 수입",
      [IncomeCategory.OTHER]: "기타",
    };
    return categoryNames[this.category] || this.category;
  }

  getStatusDisplayName(): string {
    const statusNames = {
      [IncomeStatus.PLANNED]: "계획됨",
      [IncomeStatus.EXPECTED]: "예상됨",
      [IncomeStatus.CONFIRMED]: "확정됨",
      [IncomeStatus.RECEIVED]: "수령완료",
      [IncomeStatus.PENDING]: "대기중",
      [IncomeStatus.CANCELLED]: "취소됨",
      [IncomeStatus.OVERDUE]: "연체",
    };
    return statusNames[this.status] || this.status;
  }
}
