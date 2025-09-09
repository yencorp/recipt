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
  IsInt,
} from "class-validator";
import { Settlement } from "./settlement.entity";
import { ReceiptScan } from "./receipt-scan.entity";
import { OcrResult } from "./ocr-result.entity";

export enum SettlementItemType {
  INCOME = "INCOME", // 수입 항목
  EXPENSE = "EXPENSE", // 지출 항목
}

export enum SettlementItemStatus {
  PENDING = "PENDING", // 대기중
  VERIFIED = "VERIFIED", // 검증됨
  DISPUTED = "DISPUTED", // 이의제기됨
  REJECTED = "REJECTED", // 반려됨
  APPROVED = "APPROVED", // 승인됨
}

export enum DataSource {
  MANUAL = "MANUAL", // 수동 입력
  OCR = "OCR", // OCR 자동 인식
  IMPORT = "IMPORT", // 외부 시스템 가져오기
  API = "API", // API 연동
}

@Entity("settlement_items")
@Index("idx_settlement_items_settlement", ["settlementId"])
@Index("idx_settlement_items_type", ["type"])
@Index("idx_settlement_items_status", ["status"])
@Index("idx_settlement_items_category", ["category"])
@Index("idx_settlement_items_date", ["transactionDate"])
@Index("idx_settlement_items_amount", ["actualAmount"])
@Index("idx_settlement_items_receipt", ["receiptScanId"])
@Index("idx_settlement_items_ocr", ["ocrResultId"])
@Index("idx_settlement_items_source", ["dataSource"])
export class SettlementItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "settlement_id" })
  @IsNotEmpty({ message: "결산 ID는 필수 입력 항목입니다." })
  settlementId: string;

  @Column({
    type: "uuid",
    nullable: true,
    name: "receipt_scan_id",
    comment: "연관 영수증 스캔 ID",
  })
  @IsOptional()
  receiptScanId?: string;

  @Column({
    type: "uuid",
    nullable: true,
    name: "ocr_result_id",
    comment: "연관 OCR 결과 ID",
  })
  @IsOptional()
  ocrResultId?: string;

  @Column({
    type: "uuid",
    nullable: true,
    name: "budget_item_id",
    comment: "연관 예산 항목 ID",
  })
  @IsOptional()
  budgetItemId?: string;

  @Column({
    type: "enum",
    enum: SettlementItemType,
    comment: "항목 유형 (수입/지출)",
  })
  @IsEnum(SettlementItemType, { message: "유효한 항목 유형을 선택해주세요." })
  type: SettlementItemType;

  @Column({
    type: "enum",
    enum: SettlementItemStatus,
    default: SettlementItemStatus.PENDING,
    comment: "항목 상태",
  })
  @IsEnum(SettlementItemStatus, { message: "유효한 항목 상태를 선택해주세요." })
  status: SettlementItemStatus;

  @Column({
    type: "enum",
    enum: DataSource,
    default: DataSource.MANUAL,
    comment: "데이터 출처",
  })
  @IsEnum(DataSource, { message: "유효한 데이터 출처를 선택해주세요." })
  dataSource: DataSource;

  @Column({ type: "varchar", length: 200, comment: "항목명" })
  @IsNotEmpty({ message: "항목명은 필수 입력 항목입니다." })
  @Length(1, 200, { message: "항목명은 1자 이상 200자 이하로 입력해주세요." })
  itemName: string;

  @Column({ type: "text", nullable: true, comment: "항목 설명" })
  @IsOptional()
  description?: string;

  @Column({ type: "varchar", length: 100, nullable: true, comment: "카테고리" })
  @IsOptional()
  category?: string;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    comment: "실제 금액",
  })
  @IsNotEmpty({ message: "실제 금액은 필수 입력 항목입니다." })
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 금액을 입력해주세요." }
  )
  @Min(0, { message: "금액은 0 이상이어야 합니다." })
  actualAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    comment: "예산 금액",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 예산 금액을 입력해주세요." }
  )
  @Min(0, { message: "예산 금액은 0 이상이어야 합니다." })
  budgetAmount?: number;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    comment: "세율 (%)",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 세율을 입력해주세요." }
  )
  @Min(0, { message: "세율은 0 이상이어야 합니다." })
  taxRate?: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    comment: "세금 금액",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 세금 금액을 입력해주세요." }
  )
  @Min(0, { message: "세금 금액은 0 이상이어야 합니다." })
  taxAmount?: number;

  @Column({ type: "varchar", length: 3, default: "KRW" })
  currency: string;

  @Column({ type: "integer", default: 1, comment: "수량" })
  @IsInt({ message: "수량은 정수여야 합니다." })
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

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "공급업체/거래처",
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
    comment: "거래처 연락처",
  })
  @IsOptional()
  vendorContact?: string;

  @Column({ type: "date", nullable: true, comment: "거래 일자" })
  @IsOptional()
  @IsDate({ message: "유효한 거래 일자를 입력해주세요." })
  transactionDate?: Date;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "지불/수령 방법",
  })
  @IsOptional()
  paymentMethod?: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "영수증/거래 번호",
  })
  @IsOptional()
  receiptNumber?: string;

  @Column({ type: "varchar", length: 100, nullable: true, comment: "담당자" })
  @IsOptional()
  responsiblePerson?: string;

  @Column({ type: "boolean", default: false, comment: "검증 완료 여부" })
  isValidated: boolean;

  @Column({ type: "uuid", nullable: true, comment: "검증자 ID" })
  validatedBy?: string;

  @Column({ type: "timestamp", nullable: true, comment: "검증 시간" })
  validatedAt?: Date;

  @Column({ type: "text", nullable: true, comment: "검증 메모" })
  @IsOptional()
  validationNotes?: string;

  @Column({ type: "jsonb", nullable: true, comment: "OCR 신뢰도 정보" })
  ocrConfidence?: {
    overall?: number;
    amount?: number;
    vendor?: number;
    date?: number;
    itemName?: number;
    [key: string]: number | undefined;
  };

  @Column({ type: "jsonb", nullable: true, comment: "검증 결과" })
  validationResult?: {
    isAmountValid?: boolean;
    isVendorValid?: boolean;
    isDateValid?: boolean;
    isCategoryValid?: boolean;
    discrepancies?: Array<{
      field: string;
      expected?: any;
      actual?: any;
      severity?: "LOW" | "MEDIUM" | "HIGH";
    }>;
    autoValidationScore?: number;
    manualReviewRequired?: boolean;
    [key: string]: any;
  };

  @Column({ type: "jsonb", nullable: true, comment: "메타데이터" })
  metadata?: {
    tags?: string[];
    location?: string;
    project?: string;
    costCenter?: string;
    approvalRequired?: boolean;
    evidenceLevel?: "HIGH" | "MEDIUM" | "LOW";
    auditTrail?: Array<{
      action: string;
      timestamp: Date;
      userId: string;
      details?: string;
    }>;
    [key: string]: any;
  };

  @Column({ type: "text", nullable: true, comment: "메모" })
  @IsOptional()
  notes?: string;

  @Column({ type: "integer", default: 1, comment: "표시 순서" })
  displayOrder: number;

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
  @ManyToOne(() => Settlement, (settlement) => settlement.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "settlement_id" })
  settlement: Settlement;

  @ManyToOne(() => ReceiptScan, (receiptScan) => receiptScan.settlementItems, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "receipt_scan_id" })
  receiptScan?: ReceiptScan;

  @ManyToOne(() => OcrResult, (ocrResult) => ocrResult.settlementItems, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "ocr_result_id" })
  ocrResult?: OcrResult;

  // 가상 속성
  get variance(): number {
    if (!this.budgetAmount) return 0;
    return this.actualAmount - this.budgetAmount;
  }

  get variancePercentage(): number {
    if (!this.budgetAmount || this.budgetAmount === 0) return 0;
    return (this.variance / this.budgetAmount) * 100;
  }

  get totalAmount(): number {
    return this.actualAmount * this.quantity;
  }

  get totalWithTax(): number {
    if (this.taxRate && this.taxRate > 0) {
      return this.totalAmount * (1 + this.taxRate / 100);
    }
    return this.totalAmount;
  }

  get isOverBudget(): boolean {
    return this.variance > 0;
  }

  get isUnderBudget(): boolean {
    return this.variance < 0;
  }

  get requiresManualReview(): boolean {
    return (
      this.validationResult?.manualReviewRequired === true ||
      (this.ocrConfidence?.overall && this.ocrConfidence.overall < 0.8) ||
      this.status === SettlementItemStatus.DISPUTED
    );
  }

  get evidenceQuality(): "HIGH" | "MEDIUM" | "LOW" {
    if (
      this.receiptScanId &&
      this.isValidated &&
      this.ocrConfidence?.overall &&
      this.ocrConfidence.overall > 0.9
    ) {
      return "HIGH";
    }
    if (this.receiptScanId || this.isValidated) {
      return "MEDIUM";
    }
    return "LOW";
  }

  // 비즈니스 메서드
  validate(validatedBy: string, notes?: string): void {
    this.isValidated = true;
    this.validatedBy = validatedBy;
    this.validatedAt = new Date();
    this.status = SettlementItemStatus.VERIFIED;
    if (notes) this.validationNotes = notes;
  }

  dispute(reason?: string): void {
    this.status = SettlementItemStatus.DISPUTED;
    if (reason) this.validationNotes = reason;
  }

  approve(): void {
    this.status = SettlementItemStatus.APPROVED;
  }

  reject(reason?: string): void {
    this.status = SettlementItemStatus.REJECTED;
    if (reason) this.validationNotes = reason;
  }

  calculateTax(): void {
    if (this.taxRate && this.taxRate > 0) {
      this.taxAmount = this.totalAmount * (this.taxRate / 100);
    }
  }

  updateQuantity(quantity: number): void {
    this.quantity = quantity;
    if (this.unitPrice) {
      this.actualAmount = this.unitPrice * quantity;
      this.calculateTax();
    }
  }

  updateUnitPrice(unitPrice: number): void {
    this.unitPrice = unitPrice;
    this.actualAmount = unitPrice * this.quantity;
    this.calculateTax();
  }

  updateOcrConfidence(confidence: SettlementItem["ocrConfidence"]): void {
    this.ocrConfidence = {
      ...this.ocrConfidence,
      ...confidence,
    };
  }

  addValidationResult(
    result: Partial<SettlementItem["validationResult"]>
  ): void {
    this.validationResult = {
      ...this.validationResult,
      ...result,
    };

    // 자동 검증 점수가 높으면 자동 승인
    if (
      this.validationResult.autoValidationScore &&
      this.validationResult.autoValidationScore > 0.95 &&
      !this.validationResult.manualReviewRequired
    ) {
      this.status = SettlementItemStatus.VERIFIED;
    }
  }

  updateMetadata(newMetadata: Partial<SettlementItem["metadata"]>): void {
    this.metadata = {
      ...this.metadata,
      ...newMetadata,
    };
  }

  addAuditTrail(action: string, userId: string, details?: string): void {
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.auditTrail) this.metadata.auditTrail = [];

    this.metadata.auditTrail.push({
      action,
      timestamp: new Date(),
      userId,
      details,
    });
  }

  getTypeDisplayName(): string {
    const typeNames = {
      [SettlementItemType.INCOME]: "수입",
      [SettlementItemType.EXPENSE]: "지출",
    };
    return typeNames[this.type] || this.type;
  }

  getStatusDisplayName(): string {
    const statusNames = {
      [SettlementItemStatus.PENDING]: "대기중",
      [SettlementItemStatus.VERIFIED]: "검증됨",
      [SettlementItemStatus.DISPUTED]: "이의제기됨",
      [SettlementItemStatus.REJECTED]: "반려됨",
      [SettlementItemStatus.APPROVED]: "승인됨",
    };
    return statusNames[this.status] || this.status;
  }

  getDataSourceDisplayName(): string {
    const sourceNames = {
      [DataSource.MANUAL]: "수동입력",
      [DataSource.OCR]: "OCR자동인식",
      [DataSource.IMPORT]: "외부가져오기",
      [DataSource.API]: "API연동",
    };
    return sourceNames[this.dataSource] || this.dataSource;
  }
}
