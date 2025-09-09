import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDecimal,
  Min,
  Max,
  IsUUID,
  IsInt,
} from "class-validator";
import { ReceiptScan } from "./receipt-scan.entity";

export enum ValidationStatus {
  PENDING = "PENDING", // 검증 대기
  IN_PROGRESS = "IN_PROGRESS", // 검증 진행중
  PASSED = "PASSED", // 검증 통과
  FAILED = "FAILED", // 검증 실패
  MANUAL_REVIEW = "MANUAL_REVIEW", // 수동 검토 필요
  APPROVED = "APPROVED", // 승인됨
  REJECTED = "REJECTED", // 거부됨
}

export enum ValidationType {
  AUTOMATIC = "AUTOMATIC", // 자동 검증
  MANUAL = "MANUAL", // 수동 검증
  HYBRID = "HYBRID", // 혼합 검증 (자동 + 수동)
  AI_ASSISTED = "AI_ASSISTED", // AI 보조 검증
}

export enum ValidationMethod {
  OCR_CONFIDENCE = "OCR_CONFIDENCE", // OCR 신뢰도 기반
  PATTERN_MATCHING = "PATTERN_MATCHING", // 패턴 매칭
  BUSINESS_RULES = "BUSINESS_RULES", // 비즈니스 규칙
  CROSS_REFERENCE = "CROSS_REFERENCE", // 교차 참조
  HISTORICAL_DATA = "HISTORICAL_DATA", // 과거 데이터 비교
  EXTERNAL_API = "EXTERNAL_API", // 외부 API 검증
  MANUAL_CHECK = "MANUAL_CHECK", // 수동 확인
}

export enum RiskLevel {
  VERY_LOW = "VERY_LOW", // 매우 낮음 (0-0.2)
  LOW = "LOW", // 낮음 (0.2-0.4)
  MEDIUM = "MEDIUM", // 보통 (0.4-0.6)
  HIGH = "HIGH", // 높음 (0.6-0.8)
  VERY_HIGH = "VERY_HIGH", // 매우 높음 (0.8-1.0)
}

@Entity("receipt_validations")
@Index("idx_receipt_validations_receipt", ["receiptScanId"])
@Index("idx_receipt_validations_status", ["status"])
@Index("idx_receipt_validations_type", ["type"])
@Index("idx_receipt_validations_risk", ["riskLevel"])
@Index("idx_receipt_validations_score", ["validationScore"])
@Index("idx_receipt_validations_validator", ["validatedBy"])
@Index("idx_receipt_validations_date", ["validatedAt"])
export class ReceiptValidation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "receipt_scan_id", comment: "영수증 스캔 ID" })
  @IsNotEmpty({ message: "영수증 스캔 ID는 필수 입력 항목입니다." })
  @IsUUID(4, { message: "유효한 영수증 스캔 ID를 입력해주세요." })
  receiptScanId: string;

  @Column({
    type: "enum",
    enum: ValidationStatus,
    default: ValidationStatus.PENDING,
    comment: "검증 상태",
  })
  @IsEnum(ValidationStatus, { message: "유효한 검증 상태를 선택해주세요." })
  status: ValidationStatus;

  @Column({
    type: "enum",
    enum: ValidationType,
    default: ValidationType.AUTOMATIC,
    comment: "검증 유형",
  })
  @IsEnum(ValidationType, { message: "유효한 검증 유형을 선택해주세요." })
  type: ValidationType;

  @Column({
    type: "enum",
    enum: RiskLevel,
    default: RiskLevel.LOW,
    comment: "위험 수준",
  })
  @IsEnum(RiskLevel, { message: "유효한 위험 수준을 선택해주세요." })
  riskLevel: RiskLevel;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    comment: "검증 점수 (0-100)",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 검증 점수를 입력해주세요." }
  )
  @Min(0, { message: "검증 점수는 0 이상이어야 합니다." })
  @Max(100, { message: "검증 점수는 100 이하여야 합니다." })
  validationScore?: number;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    comment: "신뢰도 점수 (0-1)",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 신뢰도 점수를 입력해주세요." }
  )
  @Min(0, { message: "신뢰도 점수는 0 이상이어야 합니다." })
  @Max(1, { message: "신뢰도 점수는 1 이하여야 합니다." })
  confidenceScore?: number;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    comment: "위험 점수 (0-1)",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 위험 점수를 입력해주세요." }
  )
  @Min(0, { message: "위험 점수는 0 이상이어야 합니다." })
  @Max(1, { message: "위험 점수는 1 이하여야 합니다." })
  riskScore?: number;

  @Column({ type: "jsonb", comment: "검증 방법별 결과" })
  methodResults: Record<
    ValidationMethod,
    {
      applied: boolean;
      passed: boolean;
      score?: number;
      confidence?: number;
      details?: string;
      executedAt?: Date;
      processingTime?: number;
      errors?: string[];
    }
  >;

  @Column({ type: "jsonb", comment: "필드별 검증 결과" })
  fieldValidations: Record<
    string,
    {
      isValid: boolean;
      confidence: number;
      originalValue?: any;
      validatedValue?: any;
      correctedValue?: any;
      validationMethods: ValidationMethod[];
      issues?: Array<{
        type: string;
        severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
        message: string;
        suggestion?: string;
      }>;
      manualReviewRequired?: boolean;
    }
  >;

  @Column({ type: "jsonb", nullable: true, comment: "비즈니스 규칙 검증 결과" })
  businessRuleResults?: {
    totalRules: number;
    passedRules: number;
    failedRules: number;
    skippedRules: number;
    ruleDetails: Array<{
      ruleId: string;
      ruleName: string;
      ruleDescription: string;
      status: "PASSED" | "FAILED" | "SKIPPED" | "WARNING";
      executedAt: Date;
      processingTime?: number;
      inputValues?: Record<string, any>;
      expectedResult?: any;
      actualResult?: any;
      errorMessage?: string;
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    }>;
    overallCompliance: number;
  };

  @Column({ type: "jsonb", nullable: true, comment: "이상 탐지 결과" })
  anomalyDetection?: {
    anomaliesFound: number;
    anomalies: Array<{
      type: string;
      category: "AMOUNT" | "VENDOR" | "DATE" | "FORMAT" | "PATTERN" | "OTHER";
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      description: string;
      confidence: number;
      affectedFields: string[];
      expectedValue?: any;
      actualValue?: any;
      historicalComparison?: {
        averageValue?: any;
        standardDeviation?: number;
        percentile?: number;
      };
      recommendation?: string;
    }>;
    overallAnomalyScore: number;
  };

  @Column({ type: "jsonb", nullable: true, comment: "외부 검증 결과" })
  externalValidation?: {
    vendorVerification?: {
      isVerified: boolean;
      source: string;
      confidence: number;
      details?: Record<string, any>;
    };
    taxIdVerification?: {
      isValid: boolean;
      source: string;
      details?: Record<string, any>;
    };
    receiptAuthentication?: {
      isAuthentic: boolean;
      source: string;
      confidence: number;
      details?: Record<string, any>;
    };
    priceVerification?: {
      isPriceValid: boolean;
      source: string;
      marketPrice?: number;
      priceVariance?: number;
      details?: Record<string, any>;
    };
  };

  @Column({ type: "jsonb", nullable: true, comment: "과거 데이터 비교 결과" })
  historicalComparison?: {
    similarReceiptsFound: number;
    averageAmount?: number;
    medianAmount?: number;
    standardDeviation?: number;
    percentileRank?: number;
    frequencyAnalysis?: {
      vendorFrequency?: number;
      categoryFrequency?: number;
      timePatternAnalysis?: Record<string, any>;
    };
    outlierAnalysis?: {
      isOutlier: boolean;
      outlierType: "AMOUNT" | "FREQUENCY" | "TIMING" | "PATTERN";
      outlierScore: number;
      explanation?: string;
    };
  };

  @Column({ type: "jsonb", nullable: true, comment: "품질 메트릭" })
  qualityMetrics?: {
    completenessScore: number;
    accuracyScore: number;
    consistencyScore: number;
    reliabilityScore: number;
    timeliness: number;
    dataIntegrity: number;
    overallQuality: number;
    qualityIssues?: Array<{
      metric: string;
      issue: string;
      impact: "LOW" | "MEDIUM" | "HIGH";
      recommendation: string;
    }>;
  };

  @Column({ type: "integer", nullable: true, comment: "처리 시간 (ms)" })
  @IsOptional()
  @IsInt({ message: "처리 시간은 정수여야 합니다." })
  @Min(0, { message: "처리 시간은 0 이상이어야 합니다." })
  processingTimeMs?: number;

  @Column({ type: "uuid", nullable: true, comment: "검증자 ID" })
  @IsOptional()
  @IsUUID(4, { message: "유효한 사용자 ID를 입력해주세요." })
  validatedBy?: string;

  @Column({ type: "uuid", nullable: true, comment: "승인자 ID" })
  @IsOptional()
  @IsUUID(4, { message: "유효한 사용자 ID를 입력해주세요." })
  approvedBy?: string;

  @Column({ type: "timestamp", nullable: true, comment: "검증 시작 시간" })
  validationStartedAt?: Date;

  @Column({ type: "timestamp", nullable: true, comment: "검증 완료 시간" })
  validatedAt?: Date;

  @Column({ type: "timestamp", nullable: true, comment: "승인 시간" })
  approvedAt?: Date;

  @Column({ type: "text", nullable: true, comment: "검증 요약" })
  @IsOptional()
  validationSummary?: string;

  @Column({ type: "text", nullable: true, comment: "검증자 의견" })
  @IsOptional()
  validatorNotes?: string;

  @Column({ type: "text", nullable: true, comment: "거부 사유" })
  @IsOptional()
  rejectionReason?: string;

  @Column({ type: "jsonb", nullable: true, comment: "권장 사항" })
  recommendations?: Array<{
    type: "CORRECTION" | "IMPROVEMENT" | "WARNING" | "ENHANCEMENT";
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    title: string;
    description: string;
    affectedFields?: string[];
    actionRequired: boolean;
    estimatedEffort?: string;
    implementation?: string;
  }>;

  @Column({ type: "jsonb", nullable: true, comment: "감사 추적 정보" })
  auditTrail?: Array<{
    action: string;
    timestamp: Date;
    userId?: string;
    previousValue?: any;
    newValue?: any;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }>;

  @Column({ type: "jsonb", nullable: true, comment: "메타데이터" })
  metadata?: {
    validationVersion?: string;
    rulesVersion?: string;
    modelVersion?: string;
    environment?: string;
    batchId?: string;
    correlationId?: string;
    flags?: string[];
    customAttributes?: Record<string, any>;
    [key: string]: any;
  };

  @Column({ type: "boolean", default: false, comment: "수동 검토 필요 여부" })
  requiresManualReview: boolean;

  @Column({ type: "boolean", default: false, comment: "자동 승인 가능 여부" })
  autoApprovalEligible: boolean;

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
  @OneToOne(() => ReceiptScan, (receiptScan) => receiptScan.validation, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "receipt_scan_id" })
  receiptScan: ReceiptScan;

  // 가상 속성
  get isPassed(): boolean {
    return this.status === ValidationStatus.PASSED;
  }

  get isFailed(): boolean {
    return this.status === ValidationStatus.FAILED;
  }

  get isApproved(): boolean {
    return this.status === ValidationStatus.APPROVED;
  }

  get isRejected(): boolean {
    return this.status === ValidationStatus.REJECTED;
  }

  get needsManualReview(): boolean {
    return (
      this.requiresManualReview ||
      this.status === ValidationStatus.MANUAL_REVIEW
    );
  }

  get isHighRisk(): boolean {
    return (
      this.riskLevel === RiskLevel.HIGH ||
      this.riskLevel === RiskLevel.VERY_HIGH
    );
  }

  get isLowRisk(): boolean {
    return (
      this.riskLevel === RiskLevel.VERY_LOW || this.riskLevel === RiskLevel.LOW
    );
  }

  get isHighConfidence(): boolean {
    return this.confidenceScore !== undefined && this.confidenceScore >= 0.8;
  }

  get isLowConfidence(): boolean {
    return this.confidenceScore !== undefined && this.confidenceScore < 0.6;
  }

  get validationDuration(): number | null {
    if (!this.validationStartedAt || !this.validatedAt) return null;
    return this.validatedAt.getTime() - this.validationStartedAt.getTime();
  }

  get validationDurationInSeconds(): number | null {
    const duration = this.validationDuration;
    return duration ? Math.round((duration / 1000) * 100) / 100 : null;
  }

  get appliedMethodsCount(): number {
    return Object.values(this.methodResults || {}).filter(
      (result) => result.applied
    ).length;
  }

  get passedMethodsCount(): number {
    return Object.values(this.methodResults || {}).filter(
      (result) => result.applied && result.passed
    ).length;
  }

  get methodSuccessRate(): number {
    const appliedCount = this.appliedMethodsCount;
    if (appliedCount === 0) return 0;
    return (this.passedMethodsCount / appliedCount) * 100;
  }

  get validFieldsCount(): number {
    return Object.values(this.fieldValidations || {}).filter(
      (field) => field.isValid
    ).length;
  }

  get invalidFieldsCount(): number {
    return Object.values(this.fieldValidations || {}).filter(
      (field) => !field.isValid
    ).length;
  }

  get totalFieldsCount(): number {
    return Object.keys(this.fieldValidations || {}).length;
  }

  get fieldValidationRate(): number {
    const totalCount = this.totalFieldsCount;
    if (totalCount === 0) return 0;
    return (this.validFieldsCount / totalCount) * 100;
  }

  get criticalIssuesCount(): number {
    let count = 0;
    Object.values(this.fieldValidations || {}).forEach((field) => {
      count +=
        field.issues?.filter((issue) => issue.severity === "CRITICAL").length ||
        0;
    });
    return count;
  }

  get hasAnomalies(): boolean {
    return this.anomalyDetection && this.anomalyDetection.anomaliesFound > 0;
  }

  get criticalAnomaliesCount(): number {
    return (
      this.anomalyDetection?.anomalies?.filter((a) => a.severity === "CRITICAL")
        .length || 0
    );
  }

  get overallHealthScore(): number {
    if (!this.validationScore || !this.confidenceScore) return 0;

    // 가중 평균: 검증 점수 70%, 신뢰도 20%, 품질 10%
    const validationWeight = 0.7;
    const confidenceWeight = 0.2;
    const qualityWeight = 0.1;

    const qualityScore = this.qualityMetrics?.overallQuality || 0;

    return (
      this.validationScore * validationWeight +
      this.confidenceScore * 100 * confidenceWeight +
      qualityScore * qualityWeight
    );
  }

  // 비즈니스 메서드
  startValidation(): void {
    this.status = ValidationStatus.IN_PROGRESS;
    this.validationStartedAt = new Date();
    this.addAuditEntry(
      "VALIDATION_STARTED",
      null,
      null,
      "Validation process started"
    );
  }

  pass(validatorId?: string): void {
    this.status = ValidationStatus.PASSED;
    this.validatedAt = new Date();
    if (validatorId) this.validatedBy = validatorId;
    this.calculateScores();
    this.addAuditEntry("VALIDATION_PASSED", null, null, "Validation passed");
  }

  fail(reason?: string, validatorId?: string): void {
    this.status = ValidationStatus.FAILED;
    this.validatedAt = new Date();
    if (validatorId) this.validatedBy = validatorId;
    if (reason) this.rejectionReason = reason;
    this.calculateScores();
    this.addAuditEntry(
      "VALIDATION_FAILED",
      null,
      null,
      reason || "Validation failed"
    );
  }

  requireManualReview(reason?: string): void {
    this.status = ValidationStatus.MANUAL_REVIEW;
    this.requiresManualReview = true;
    if (reason) this.validatorNotes = reason;
    this.addAuditEntry(
      "MANUAL_REVIEW_REQUIRED",
      null,
      null,
      reason || "Manual review required"
    );
  }

  approve(approverId: string, notes?: string): void {
    this.status = ValidationStatus.APPROVED;
    this.approvedBy = approverId;
    this.approvedAt = new Date();
    if (notes) this.validatorNotes = notes;
    this.addAuditEntry(
      "VALIDATION_APPROVED",
      null,
      null,
      notes || "Validation approved"
    );
  }

  reject(rejectorId: string, reason?: string): void {
    this.status = ValidationStatus.REJECTED;
    this.approvedBy = rejectorId;
    this.approvedAt = new Date();
    if (reason) this.rejectionReason = reason;
    this.addAuditEntry(
      "VALIDATION_REJECTED",
      null,
      null,
      reason || "Validation rejected"
    );
  }

  private calculateScores(): void {
    // 검증 점수 계산
    this.validationScore = this.fieldValidationRate;

    // 신뢰도 점수 계산
    const confidences = Object.values(this.fieldValidations || {}).map(
      (field) => field.confidence
    );
    this.confidenceScore =
      confidences.length > 0
        ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
        : 0;

    // 위험 점수 계산
    this.riskScore = this.calculateRiskScore();
    this.riskLevel = this.determineRiskLevel(this.riskScore);
  }

  private calculateRiskScore(): number {
    let riskScore = 0;

    // 검증 실패율 기반 위험
    riskScore += ((100 - this.fieldValidationRate) / 100) * 0.4;

    // 신뢰도 부족 기반 위험
    riskScore += (1 - (this.confidenceScore || 0)) * 0.3;

    // 이상 탐지 기반 위험
    if (this.anomalyDetection) {
      riskScore += (this.anomalyDetection.overallAnomalyScore || 0) * 0.2;
    }

    // 비즈니스 규칙 위반 기반 위험
    if (this.businessRuleResults) {
      const ruleFailureRate =
        this.businessRuleResults.failedRules /
        this.businessRuleResults.totalRules;
      riskScore += ruleFailureRate * 0.1;
    }

    return Math.min(1, Math.max(0, riskScore));
  }

  private determineRiskLevel(riskScore: number): RiskLevel {
    if (riskScore < 0.2) return RiskLevel.VERY_LOW;
    if (riskScore < 0.4) return RiskLevel.LOW;
    if (riskScore < 0.6) return RiskLevel.MEDIUM;
    if (riskScore < 0.8) return RiskLevel.HIGH;
    return RiskLevel.VERY_HIGH;
  }

  updateFieldValidation(
    field: string,
    isValid: boolean,
    confidence: number,
    issues?: ReceiptValidation["fieldValidations"][string]["issues"]
  ): void {
    if (!this.fieldValidations) this.fieldValidations = {};

    if (!this.fieldValidations[field]) {
      this.fieldValidations[field] = {
        isValid,
        confidence,
        validationMethods: [],
      };
    } else {
      this.fieldValidations[field].isValid = isValid;
      this.fieldValidations[field].confidence = confidence;
    }

    if (issues) {
      this.fieldValidations[field].issues = issues;
      this.fieldValidations[field].manualReviewRequired = issues.some(
        (issue) => issue.severity === "CRITICAL" || issue.severity === "ERROR"
      );
    }
  }

  addMethodResult(
    method: ValidationMethod,
    result: ReceiptValidation["methodResults"][ValidationMethod]
  ): void {
    if (!this.methodResults) this.methodResults = {} as any;
    this.methodResults[method] = result;
  }

  updateBusinessRuleResults(
    results: ReceiptValidation["businessRuleResults"]
  ): void {
    this.businessRuleResults = results;

    // 비즈니스 규칙 실패가 많으면 수동 검토 필요
    if (results && results.failedRules > 0) {
      const failureRate = results.failedRules / results.totalRules;
      if (failureRate > 0.3) {
        this.requiresManualReview = true;
      }
    }
  }

  updateAnomalyDetection(
    detection: ReceiptValidation["anomalyDetection"]
  ): void {
    this.anomalyDetection = detection;

    // 심각한 이상이 발견되면 수동 검토 필요
    if (
      detection &&
      detection.anomalies.some((a) => a.severity === "CRITICAL")
    ) {
      this.requiresManualReview = true;
    }
  }

  addRecommendation(
    recommendation: ReceiptValidation["recommendations"][0]
  ): void {
    if (!this.recommendations) this.recommendations = [];
    this.recommendations.push(recommendation);
  }

  updateQualityMetrics(metrics: ReceiptValidation["qualityMetrics"]): void {
    this.qualityMetrics = metrics;
  }

  addAuditEntry(
    action: string,
    previousValue: any,
    newValue: any,
    reason?: string
  ): void {
    if (!this.auditTrail) this.auditTrail = [];

    this.auditTrail.push({
      action,
      timestamp: new Date(),
      previousValue,
      newValue,
      reason,
    });
  }

  updateMetadata(newMetadata: Partial<ReceiptValidation["metadata"]>): void {
    this.metadata = {
      ...this.metadata,
      ...newMetadata,
    };
  }

  getStatusDisplayName(): string {
    const statusNames = {
      [ValidationStatus.PENDING]: "검증대기",
      [ValidationStatus.IN_PROGRESS]: "검증진행중",
      [ValidationStatus.PASSED]: "검증통과",
      [ValidationStatus.FAILED]: "검증실패",
      [ValidationStatus.MANUAL_REVIEW]: "수동검토필요",
      [ValidationStatus.APPROVED]: "승인됨",
      [ValidationStatus.REJECTED]: "거부됨",
    };
    return statusNames[this.status] || this.status;
  }

  getTypeDisplayName(): string {
    const typeNames = {
      [ValidationType.AUTOMATIC]: "자동검증",
      [ValidationType.MANUAL]: "수동검증",
      [ValidationType.HYBRID]: "혼합검증",
      [ValidationType.AI_ASSISTED]: "AI보조검증",
    };
    return typeNames[this.type] || this.type;
  }

  getRiskLevelDisplayName(): string {
    const riskNames = {
      [RiskLevel.VERY_LOW]: "매우낮음",
      [RiskLevel.LOW]: "낮음",
      [RiskLevel.MEDIUM]: "보통",
      [RiskLevel.HIGH]: "높음",
      [RiskLevel.VERY_HIGH]: "매우높음",
    };
    return riskNames[this.riskLevel] || this.riskLevel;
  }
}
