import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
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
  Max,
  IsUUID,
  IsInt,
} from "class-validator";
import { ReceiptScan } from "./receipt-scan.entity";
import { SettlementItem } from "./settlement-item.entity";

export enum OcrEngine {
  GOOGLE_VISION = "GOOGLE_VISION", // Google Cloud Vision API
  AWS_TEXTRACT = "AWS_TEXTRACT", // Amazon Textract
  AZURE_FORM_RECOGNIZER = "AZURE_FORM_RECOGNIZER", // Azure Form Recognizer
  TESSERACT = "TESSERACT", // Tesseract OCR
  NAVER_CLOVA = "NAVER_CLOVA", // Naver Clova OCR
  KAKAO_OCR = "KAKAO_OCR", // Kakao OCR
  CUSTOM = "CUSTOM", // 커스텀 OCR 엔진
}

export enum OcrStatus {
  PENDING = "PENDING", // 처리 대기
  PROCESSING = "PROCESSING", // 처리중
  COMPLETED = "COMPLETED", // 완료
  FAILED = "FAILED", // 실패
  MANUAL_REVIEW = "MANUAL_REVIEW", // 수동 검토 필요
  CORRECTED = "CORRECTED", // 수정됨
}

export enum FieldType {
  VENDOR_NAME = "VENDOR_NAME", // 업체명
  VENDOR_ADDRESS = "VENDOR_ADDRESS", // 업체 주소
  VENDOR_PHONE = "VENDOR_PHONE", // 업체 전화번호
  VENDOR_REGISTRATION = "VENDOR_REGISTRATION", // 사업자번호
  RECEIPT_NUMBER = "RECEIPT_NUMBER", // 영수증 번호
  RECEIPT_DATE = "RECEIPT_DATE", // 날짜
  RECEIPT_TIME = "RECEIPT_TIME", // 시간
  TOTAL_AMOUNT = "TOTAL_AMOUNT", // 총 금액
  SUBTOTAL = "SUBTOTAL", // 소계
  TAX_AMOUNT = "TAX_AMOUNT", // 세금
  DISCOUNT = "DISCOUNT", // 할인
  PAYMENT_METHOD = "PAYMENT_METHOD", // 지불 방법
  CARD_NUMBER = "CARD_NUMBER", // 카드 번호
  APPROVAL_NUMBER = "APPROVAL_NUMBER", // 승인 번호
  ITEM_NAME = "ITEM_NAME", // 항목명
  ITEM_QUANTITY = "ITEM_QUANTITY", // 수량
  ITEM_PRICE = "ITEM_PRICE", // 단가
  ITEM_TOTAL = "ITEM_TOTAL", // 항목 총액
  CASHIER = "CASHIER", // 계산원
  TABLE_NUMBER = "TABLE_NUMBER", // 테이블 번호
  CUSTOMER_INFO = "CUSTOMER_INFO", // 고객 정보
  OTHER = "OTHER", // 기타
}

@Entity("ocr_results")
@Index("idx_ocr_results_receipt", ["receiptScanId"])
@Index("idx_ocr_results_engine", ["ocrEngine"])
@Index("idx_ocr_results_status", ["status"])
@Index("idx_ocr_results_confidence", ["overallConfidence"])
@Index("idx_ocr_results_processed_date", ["processedAt"])
@Index("idx_ocr_results_vendor", ["vendorName"])
@Index("idx_ocr_results_amount", ["totalAmount"])
export class OcrResult {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "receipt_scan_id", comment: "영수증 스캔 ID" })
  @IsNotEmpty({ message: "영수증 스캔 ID는 필수 입력 항목입니다." })
  @IsUUID(4, { message: "유효한 영수증 스캔 ID를 입력해주세요." })
  receiptScanId: string;

  @Column({
    type: "enum",
    enum: OcrEngine,
    default: OcrEngine.GOOGLE_VISION,
    comment: "OCR 엔진",
  })
  @IsEnum(OcrEngine, { message: "유효한 OCR 엔진을 선택해주세요." })
  ocrEngine: OcrEngine;

  @Column({
    type: "enum",
    enum: OcrStatus,
    default: OcrStatus.PENDING,
    comment: "OCR 처리 상태",
  })
  @IsEnum(OcrStatus, { message: "유효한 OCR 상태를 선택해주세요." })
  status: OcrStatus;

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
    comment: "OCR 엔진 버전",
  })
  @IsOptional()
  engineVersion?: string;

  @Column({ type: "text", comment: "원본 OCR 텍스트" })
  @IsNotEmpty({ message: "원본 텍스트는 필수 입력 항목입니다." })
  rawText: string;

  @Column({ type: "jsonb", comment: "구조화된 OCR 결과" })
  structuredData: {
    words?: Array<{
      text: string;
      confidence: number;
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      page?: number;
    }>;
    lines?: Array<{
      text: string;
      confidence: number;
      words: number[];
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    paragraphs?: Array<{
      text: string;
      confidence: number;
      lines: number[];
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    [key: string]: any;
  };

  @Column({ type: "jsonb", comment: "추출된 필드 정보" })
  extractedFields: Record<
    string,
    {
      value: any;
      confidence: number;
      fieldType: FieldType;
      source: "OCR" | "PATTERN" | "MANUAL";
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      alternatives?: Array<{
        value: any;
        confidence: number;
      }>;
      validationStatus?: "VALID" | "INVALID" | "NEEDS_REVIEW";
      correctedValue?: any;
      correctedBy?: string;
      correctedAt?: Date;
    }
  >;

  @Column({ type: "varchar", length: 100, nullable: true, comment: "업체명" })
  @IsOptional()
  @Length(1, 100, { message: "업체명은 1자 이상 100자 이하로 입력해주세요." })
  vendorName?: string;

  @Column({ type: "text", nullable: true, comment: "업체 주소" })
  @IsOptional()
  vendorAddress?: string;

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
    comment: "업체 전화번호",
  })
  @IsOptional()
  vendorPhone?: string;

  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
    comment: "사업자번호",
  })
  @IsOptional()
  vendorRegistrationNumber?: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "영수증 번호",
  })
  @IsOptional()
  receiptNumber?: string;

  @Column({ type: "date", nullable: true, comment: "영수증 날짜" })
  @IsOptional()
  receiptDate?: Date;

  @Column({ type: "time", nullable: true, comment: "영수증 시간" })
  @IsOptional()
  receiptTime?: string;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    comment: "총 금액",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 금액을 입력해주세요." }
  )
  @Min(0, { message: "금액은 0 이상이어야 합니다." })
  totalAmount?: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    comment: "소계",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 소계를 입력해주세요." }
  )
  subtotal?: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    comment: "세금",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 세금을 입력해주세요." }
  )
  taxAmount?: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    comment: "할인",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 할인액을 입력해주세요." }
  )
  discountAmount?: number;

  @Column({ type: "varchar", length: 50, nullable: true, comment: "지불 방법" })
  @IsOptional()
  paymentMethod?: string;

  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
    comment: "카드 번호 (마스킹됨)",
  })
  @IsOptional()
  cardNumber?: string;

  @Column({ type: "varchar", length: 20, nullable: true, comment: "승인 번호" })
  @IsOptional()
  approvalNumber?: string;

  @Column({ type: "varchar", length: 3, default: "KRW", comment: "통화" })
  currency: string;

  @Column({ type: "jsonb", nullable: true, comment: "항목별 상세 정보" })
  itemDetails?: Array<{
    name: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    confidence: number;
    category?: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    comment: "전체 신뢰도 (0-1)",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 신뢰도를 입력해주세요." }
  )
  @Min(0, { message: "신뢰도는 0 이상이어야 합니다." })
  @Max(1, { message: "신뢰도는 1 이하여야 합니다." })
  overallConfidence?: number;

  @Column({ type: "jsonb", nullable: true, comment: "필드별 신뢰도" })
  fieldConfidences?: Record<string, number>;

  @Column({ type: "integer", nullable: true, comment: "처리 시간 (ms)" })
  @IsOptional()
  @IsInt({ message: "처리 시간은 정수여야 합니다." })
  @Min(0, { message: "처리 시간은 0 이상이어야 합니다." })
  processingTimeMs?: number;

  @Column({ type: "jsonb", nullable: true, comment: "품질 메트릭" })
  qualityMetrics?: {
    textCoverage?: number;
    fieldCompletion?: number;
    confidenceDistribution?: Record<string, number>;
    errorRate?: number;
    ambiguityScore?: number;
    consistencyScore?: number;
  };

  @Column({ type: "jsonb", nullable: true, comment: "패턴 매칭 결과" })
  patternMatching?: {
    receiptType?: string;
    businessType?: string;
    templateMatch?: {
      templateId: string;
      confidence: number;
      version: string;
    };
    knownVendor?: {
      vendorId: string;
      confidence: number;
      matchedFields: string[];
    };
    anomalies?: Array<{
      type: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      description: string;
      affectedFields: string[];
    }>;
  };

  @Column({ type: "jsonb", nullable: true, comment: "검증 결과" })
  validationResults?: {
    isValid?: boolean;
    validatedFields?: string[];
    invalidFields?: string[];
    missingFields?: string[];
    suspiciousFields?: string[];
    businessRuleViolations?: Array<{
      rule: string;
      severity: "WARNING" | "ERROR";
      description: string;
      affectedFields: string[];
    }>;
    crossFieldValidation?: Record<string, boolean>;
  };

  @Column({ type: "text", nullable: true, comment: "에러 메시지" })
  @IsOptional()
  errorMessage?: string;

  @Column({ type: "text", nullable: true, comment: "처리 로그" })
  @IsOptional()
  processingLog?: string;

  @Column({ type: "jsonb", nullable: true, comment: "메타데이터" })
  metadata?: {
    ocrRequestId?: string;
    batchId?: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    tags?: string[];
    preprocessingSteps?: string[];
    postprocessingSteps?: string[];
    languageDetected?: string;
    orientation?: number;
    qualityEnhancement?: boolean;
    retryCount?: number;
    parentOcrResultId?: string;
    childOcrResultIds?: string[];
    [key: string]: any;
  };

  @Column({ type: "boolean", default: false, comment: "수동 검토 필요 여부" })
  requiresManualReview: boolean;

  @Column({ type: "boolean", default: false, comment: "수정됨 여부" })
  isCorrected: boolean;

  @Column({ type: "uuid", nullable: true, comment: "검토/수정자 ID" })
  @IsOptional()
  @IsUUID(4, { message: "유효한 사용자 ID를 입력해주세요." })
  reviewedBy?: string;

  @Column({ type: "timestamp", nullable: true, comment: "검토 시간" })
  reviewedAt?: Date;

  @Column({ type: "timestamp", nullable: true, comment: "처리 완료 시간" })
  processedAt?: Date;

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
  @OneToOne(() => ReceiptScan, (receiptScan) => receiptScan.ocrResult, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "receipt_scan_id" })
  receiptScan: ReceiptScan;

  @OneToMany(() => SettlementItem, (item) => item.ocrResult)
  settlementItems: SettlementItem[];

  // 가상 속성
  get isCompleted(): boolean {
    return this.status === OcrStatus.COMPLETED;
  }

  get hasFailed(): boolean {
    return this.status === OcrStatus.FAILED;
  }

  get isHighConfidence(): boolean {
    return (
      this.overallConfidence !== undefined && this.overallConfidence >= 0.8
    );
  }

  get isLowConfidence(): boolean {
    return this.overallConfidence !== undefined && this.overallConfidence < 0.6;
  }

  get needsReview(): boolean {
    return (
      this.requiresManualReview ||
      this.isLowConfidence ||
      this.status === OcrStatus.MANUAL_REVIEW
    );
  }

  get processingTimeInSeconds(): number | null {
    return this.processingTimeMs
      ? Math.round((this.processingTimeMs / 1000) * 100) / 100
      : null;
  }

  get extractedFieldsCount(): number {
    return Object.keys(this.extractedFields || {}).length;
  }

  get validFieldsCount(): number {
    if (!this.extractedFields) return 0;
    return Object.values(this.extractedFields).filter(
      (field) => field.validationStatus === "VALID"
    ).length;
  }

  get invalidFieldsCount(): number {
    if (!this.extractedFields) return 0;
    return Object.values(this.extractedFields).filter(
      (field) => field.validationStatus === "INVALID"
    ).length;
  }

  get fieldValidationRate(): number {
    const totalFields = this.extractedFieldsCount;
    if (totalFields === 0) return 0;
    return (this.validFieldsCount / totalFields) * 100;
  }

  get hasAnomalies(): boolean {
    return (
      this.patternMatching?.anomalies &&
      this.patternMatching.anomalies.length > 0
    );
  }

  get highSeverityAnomaliesCount(): number {
    return (
      this.patternMatching?.anomalies?.filter((a) => a.severity === "HIGH")
        .length || 0
    );
  }

  // 비즈니스 메서드
  complete(): void {
    this.status = OcrStatus.COMPLETED;
    this.processedAt = new Date();
    this.calculateOverallConfidence();
  }

  fail(errorMessage: string): void {
    this.status = OcrStatus.FAILED;
    this.processedAt = new Date();
    this.errorMessage = errorMessage;
  }

  markForReview(reason?: string): void {
    this.status = OcrStatus.MANUAL_REVIEW;
    this.requiresManualReview = true;
    if (reason && this.processingLog) {
      this.processingLog += `\n[${new Date().toISOString()}] Marked for review: ${reason}`;
    }
  }

  correct(userId: string): void {
    this.status = OcrStatus.CORRECTED;
    this.isCorrected = true;
    this.reviewedBy = userId;
    this.reviewedAt = new Date();
  }

  private calculateOverallConfidence(): void {
    if (!this.extractedFields) {
      this.overallConfidence = 0;
      return;
    }

    const confidences = Object.values(this.extractedFields).map(
      (field) => field.confidence
    );
    if (confidences.length === 0) {
      this.overallConfidence = 0;
      return;
    }

    // 가중 평균 계산 (중요한 필드에 더 높은 가중치)
    const weights = this.getFieldWeights();
    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(this.extractedFields).forEach(([key, field]) => {
      const weight = weights[key] || 1;
      totalWeight += weight;
      weightedSum += field.confidence * weight;
    });

    this.overallConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private getFieldWeights(): Record<string, number> {
    return {
      vendorName: 3,
      totalAmount: 3,
      receiptDate: 2,
      receiptNumber: 2,
      vendorAddress: 1.5,
      vendorPhone: 1,
      paymentMethod: 1,
    };
  }

  updateExtractedField(
    key: string,
    value: any,
    confidence: number,
    fieldType: FieldType,
    source: "OCR" | "PATTERN" | "MANUAL" = "OCR"
  ): void {
    if (!this.extractedFields) this.extractedFields = {};

    this.extractedFields[key] = {
      value,
      confidence,
      fieldType,
      source,
    };

    this.calculateOverallConfidence();
  }

  correctField(key: string, correctedValue: any, correctedBy: string): void {
    if (!this.extractedFields || !this.extractedFields[key]) return;

    this.extractedFields[key].correctedValue = correctedValue;
    this.extractedFields[key].correctedBy = correctedBy;
    this.extractedFields[key].correctedAt = new Date();
    this.extractedFields[key].validationStatus = "VALID";

    this.isCorrected = true;
  }

  validateField(key: string, isValid: boolean): void {
    if (!this.extractedFields || !this.extractedFields[key]) return;

    this.extractedFields[key].validationStatus = isValid ? "VALID" : "INVALID";
  }

  addItemDetail(item: OcrResult["itemDetails"][0]): void {
    if (!this.itemDetails) this.itemDetails = [];
    this.itemDetails.push(item);
  }

  updateQualityMetrics(metrics: Partial<OcrResult["qualityMetrics"]>): void {
    this.qualityMetrics = {
      ...this.qualityMetrics,
      ...metrics,
    };
  }

  updatePatternMatching(matching: Partial<OcrResult["patternMatching"]>): void {
    this.patternMatching = {
      ...this.patternMatching,
      ...matching,
    };
  }

  addValidationResult(result: Partial<OcrResult["validationResults"]>): void {
    this.validationResults = {
      ...this.validationResults,
      ...result,
    };

    // 검증 결과에 따라 수동 검토 필요성 판단
    if (
      result.invalidFields?.length ||
      result.businessRuleViolations?.some((v) => v.severity === "ERROR")
    ) {
      this.requiresManualReview = true;
    }
  }

  updateMetadata(newMetadata: Partial<OcrResult["metadata"]>): void {
    this.metadata = {
      ...this.metadata,
      ...newMetadata,
    };
  }

  incrementRetryCount(): void {
    if (!this.metadata) this.metadata = {};
    this.metadata.retryCount = (this.metadata.retryCount || 0) + 1;
  }

  getEngineDisplayName(): string {
    const engineNames = {
      [OcrEngine.GOOGLE_VISION]: "Google Vision",
      [OcrEngine.AWS_TEXTRACT]: "AWS Textract",
      [OcrEngine.AZURE_FORM_RECOGNIZER]: "Azure Form Recognizer",
      [OcrEngine.TESSERACT]: "Tesseract OCR",
      [OcrEngine.NAVER_CLOVA]: "Naver Clova OCR",
      [OcrEngine.KAKAO_OCR]: "Kakao OCR",
      [OcrEngine.CUSTOM]: "커스텀 OCR",
    };
    return engineNames[this.ocrEngine] || this.ocrEngine;
  }

  getStatusDisplayName(): string {
    const statusNames = {
      [OcrStatus.PENDING]: "대기중",
      [OcrStatus.PROCESSING]: "처리중",
      [OcrStatus.COMPLETED]: "완료",
      [OcrStatus.FAILED]: "실패",
      [OcrStatus.MANUAL_REVIEW]: "수동검토필요",
      [OcrStatus.CORRECTED]: "수정됨",
    };
    return statusNames[this.status] || this.status;
  }
}
