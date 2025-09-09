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

export enum ExpenseCategory {
  FACILITIES = "FACILITIES", // 시설비
  EQUIPMENT = "EQUIPMENT", // 장비/기자재
  SUPPLIES = "SUPPLIES", // 소모품
  FOOD = "FOOD", // 식비/다과비
  TRANSPORTATION = "TRANSPORTATION", // 교통비
  ACCOMMODATION = "ACCOMMODATION", // 숙박비
  SPEAKER_FEE = "SPEAKER_FEE", // 강사비
  MARKETING = "MARKETING", // 홍보비
  DECORATION = "DECORATION", // 장식비
  GIFTS = "GIFTS", // 선물/기념품
  UTILITIES = "UTILITIES", // 공과금
  INSURANCE = "INSURANCE", // 보험료
  MAINTENANCE = "MAINTENANCE", // 유지보수비
  OFFICE = "OFFICE", // 사무용품
  DONATION = "DONATION", // 기부금
  OTHER = "OTHER", // 기타
}

export enum ExpenseStatus {
  PLANNED = "PLANNED", // 계획됨
  REQUESTED = "REQUESTED", // 신청됨
  APPROVED = "APPROVED", // 승인됨
  PURCHASED = "PURCHASED", // 구매완료
  PAID = "PAID", // 지불완료
  PENDING = "PENDING", // 대기중
  REJECTED = "REJECTED", // 반려됨
  CANCELLED = "CANCELLED", // 취소됨
}

@Entity("budget_expenses")
@Index("idx_budget_expenses_budget", ["budgetId"])
@Index("idx_budget_expenses_category", ["category"])
@Index("idx_budget_expenses_status", ["status"])
@Index("idx_budget_expenses_planned_date", ["plannedDate"])
@Index("idx_budget_expenses_actual_date", ["actualDate"])
@Index("idx_budget_expenses_vendor", ["vendor"])
export class BudgetExpense {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "budget_id" })
  @IsNotEmpty({ message: "예산 ID는 필수 입력 항목입니다." })
  budgetId: string;

  @Column({ type: "varchar", length: 200, comment: "지출 항목명" })
  @IsNotEmpty({ message: "지출 항목명은 필수 입력 항목입니다." })
  @Length(2, 200, {
    message: "지출 항목명은 2자 이상 200자 이하로 입력해주세요.",
  })
  itemName: string;

  @Column({ type: "text", nullable: true, comment: "지출 설명" })
  @IsOptional()
  description?: string;

  @Column({
    type: "enum",
    enum: ExpenseCategory,
    comment: "지출 카테고리",
  })
  @IsEnum(ExpenseCategory, { message: "유효한 지출 카테고리를 선택해주세요." })
  category: ExpenseCategory;

  @Column({
    type: "enum",
    enum: ExpenseStatus,
    default: ExpenseStatus.PLANNED,
    comment: "지출 상태",
  })
  @IsEnum(ExpenseStatus, { message: "유효한 지출 상태를 선택해주세요." })
  status: ExpenseStatus;

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
    comment: "실제 지출 금액",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 실제 금액을 입력해주세요." }
  )
  @Min(0, { message: "실제 금액은 0 이상이어야 합니다." })
  actualAmount?: number;

  @Column({
    type: "integer",
    default: 1,
    comment: "수량",
  })
  @Min(1, { message: "수량은 1 이상이어야 합니다." })
  quantity: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    comment: "단가",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 단가를 입력해주세요." }
  )
  @Min(0, { message: "단가는 0 이상이어야 합니다." })
  unitPrice?: number;

  @Column({ type: "varchar", length: 3, default: "KRW" })
  currency: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "공급업체/판매처",
  })
  @IsOptional()
  @Length(1, 100, {
    message: "공급업체명은 1자 이상 100자 이하로 입력해주세요.",
  })
  vendor?: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "공급업체 연락처",
  })
  @IsOptional()
  vendorContact?: string;

  @Column({ type: "varchar", length: 100, nullable: true, comment: "담당자" })
  @IsOptional()
  responsiblePerson?: string;

  @Column({ type: "date", nullable: true, comment: "계획 구매/지출일" })
  @IsOptional()
  @IsDate({ message: "유효한 계획일을 입력해주세요." })
  plannedDate?: Date;

  @Column({ type: "date", nullable: true, comment: "실제 구매/지출일" })
  @IsOptional()
  @IsDate({ message: "유효한 실제 지출일을 입력해주세요." })
  actualDate?: Date;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "지출 방법 (현금/카드/계좌이체 등)",
  })
  @IsOptional()
  paymentMethod?: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "영수증 번호",
  })
  @IsOptional()
  receiptNumber?: string;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
    comment: "영수증 이미지 경로",
  })
  @IsOptional()
  receiptImagePath?: string;

  @Column({ type: "boolean", default: false, comment: "영수증 제출 여부" })
  hasReceipt: boolean;

  @Column({ type: "boolean", default: false, comment: "승인 필요 여부" })
  requiresApproval: boolean;

  @Column({ type: "uuid", nullable: true, comment: "승인자 ID" })
  approvedBy?: string;

  @Column({ type: "timestamp", nullable: true, comment: "승인 시간" })
  approvedAt?: Date;

  @Column({ type: "boolean", default: false, comment: "정기 지출 여부" })
  isRecurring: boolean;

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
    comment: "정기 지출 주기 (monthly, quarterly, yearly)",
  })
  @IsOptional()
  recurringCycle?: string;

  @Column({ type: "integer", default: 1, comment: "표시 순서" })
  displayOrder: number;

  @Column({ type: "boolean", default: false, comment: "세금공제 가능 여부" })
  isTaxDeductible: boolean;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    comment: "세율 (%)",
  })
  @IsOptional()
  taxRate?: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    comment: "세금 금액",
  })
  @IsOptional()
  taxAmount?: number;

  @Column({ type: "jsonb", nullable: true, comment: "추가 메타데이터" })
  metadata?: {
    tags?: string[];
    isUrgent?: boolean;
    requiresQuotes?: boolean;
    minQuotes?: number;
    specifications?: string[];
    deliveryAddress?: string;
    deliveryDate?: Date;
    warrantyPeriod?: string;
    isCapitalExpenditure?: boolean;
    depreciationPeriod?: number;
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
  @ManyToOne(() => Budget, (budget) => budget.expenses, {
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

  get isPaid(): boolean {
    return this.status === ExpenseStatus.PAID;
  }

  get totalAmount(): number {
    return (this.unitPrice || this.budgetAmount) * this.quantity;
  }

  get totalWithTax(): number {
    const baseAmount = this.actualAmount || this.budgetAmount;
    if (this.taxRate && this.taxRate > 0) {
      return baseAmount * (1 + this.taxRate / 100);
    }
    return baseAmount;
  }

  get isOverdue(): boolean {
    if (!this.plannedDate || this.isPaid) return false;
    return this.plannedDate < new Date();
  }

  get daysSincePlanned(): number {
    if (!this.plannedDate) return 0;
    const now = new Date();
    const timeDiff = now.getTime() - this.plannedDate.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  get daysUntilPlanned(): number {
    if (!this.plannedDate) return 0;
    const now = new Date();
    const timeDiff = this.plannedDate.getTime() - now.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  // 비즈니스 메서드
  markAsPaid(amount: number, actualDate?: Date, paymentMethod?: string): void {
    this.actualAmount = amount;
    this.actualDate = actualDate || new Date();
    this.status = ExpenseStatus.PAID;
    if (paymentMethod) this.paymentMethod = paymentMethod;
    this.calculateTax();
  }

  purchase(amount: number, purchaseDate?: Date, vendor?: string): void {
    this.actualAmount = amount;
    this.actualDate = purchaseDate || new Date();
    this.status = ExpenseStatus.PURCHASED;
    if (vendor) this.vendor = vendor;
  }

  request(): void {
    this.status = ExpenseStatus.REQUESTED;
  }

  approve(approvedBy: string): void {
    if (this.requiresApproval) {
      this.status = ExpenseStatus.APPROVED;
      this.approvedBy = approvedBy;
      this.approvedAt = new Date();
    }
  }

  reject(): void {
    this.status = ExpenseStatus.REJECTED;
  }

  cancel(): void {
    this.status = ExpenseStatus.CANCELLED;
  }

  attachReceipt(receiptImagePath: string, receiptNumber?: string): void {
    this.receiptImagePath = receiptImagePath;
    this.hasReceipt = true;
    if (receiptNumber) this.receiptNumber = receiptNumber;
  }

  private calculateTax(): void {
    if (this.taxRate && this.taxRate > 0 && this.actualAmount) {
      this.taxAmount = this.actualAmount * (this.taxRate / 100);
    }
  }

  updateQuantity(quantity: number): void {
    this.quantity = quantity;
    if (this.unitPrice) {
      this.budgetAmount = this.unitPrice * quantity;
    }
  }

  updateUnitPrice(unitPrice: number): void {
    this.unitPrice = unitPrice;
    this.budgetAmount = unitPrice * this.quantity;
  }

  updateMetadata(newMetadata: Partial<BudgetExpense["metadata"]>): void {
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
      [ExpenseCategory.FACILITIES]: "시설비",
      [ExpenseCategory.EQUIPMENT]: "장비/기자재",
      [ExpenseCategory.SUPPLIES]: "소모품",
      [ExpenseCategory.FOOD]: "식비/다과비",
      [ExpenseCategory.TRANSPORTATION]: "교통비",
      [ExpenseCategory.ACCOMMODATION]: "숙박비",
      [ExpenseCategory.SPEAKER_FEE]: "강사비",
      [ExpenseCategory.MARKETING]: "홍보비",
      [ExpenseCategory.DECORATION]: "장식비",
      [ExpenseCategory.GIFTS]: "선물/기념품",
      [ExpenseCategory.UTILITIES]: "공과금",
      [ExpenseCategory.INSURANCE]: "보험료",
      [ExpenseCategory.MAINTENANCE]: "유지보수비",
      [ExpenseCategory.OFFICE]: "사무용품",
      [ExpenseCategory.DONATION]: "기부금",
      [ExpenseCategory.OTHER]: "기타",
    };
    return categoryNames[this.category] || this.category;
  }

  getStatusDisplayName(): string {
    const statusNames = {
      [ExpenseStatus.PLANNED]: "계획됨",
      [ExpenseStatus.REQUESTED]: "신청됨",
      [ExpenseStatus.APPROVED]: "승인됨",
      [ExpenseStatus.PURCHASED]: "구매완료",
      [ExpenseStatus.PAID]: "지불완료",
      [ExpenseStatus.PENDING]: "대기중",
      [ExpenseStatus.REJECTED]: "반려됨",
      [ExpenseStatus.CANCELLED]: "취소됨",
    };
    return statusNames[this.status] || this.status;
  }
}
