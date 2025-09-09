import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  Index,
} from "typeorm";
import {
  IsNotEmpty,
  Length,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUrl,
  IsUUID,
} from "class-validator";
import { User } from "./user.entity";
import { Organization } from "./organization.entity";
import { OcrResult } from "./ocr-result.entity";
import { SettlementItem } from "./settlement-item.entity";
import { ReceiptValidation } from "./receipt-validation.entity";

export enum ReceiptStatus {
  UPLOADED = "UPLOADED", // 업로드됨
  PROCESSING = "PROCESSING", // 처리중
  OCR_COMPLETED = "OCR_COMPLETED", // OCR 완료
  VALIDATED = "VALIDATED", // 검증완료
  ERROR = "ERROR", // 오류
  REJECTED = "REJECTED", // 반려
  ARCHIVED = "ARCHIVED", // 보관됨
}

export enum ReceiptType {
  PURCHASE = "PURCHASE", // 구매 영수증
  INVOICE = "INVOICE", // 청구서
  RECEIPT = "RECEIPT", // 일반 영수증
  CREDIT_CARD = "CREDIT_CARD", // 카드 전표
  CASH_RECEIPT = "CASH_RECEIPT", // 현금영수증
  TAX_INVOICE = "TAX_INVOICE", // 세금계산서
  SIMPLE_RECEIPT = "SIMPLE_RECEIPT", // 간이영수증
  OTHER = "OTHER", // 기타
}

export enum FileFormat {
  JPEG = "JPEG",
  PNG = "PNG",
  PDF = "PDF",
  WEBP = "WEBP",
  HEIC = "HEIC",
  TIFF = "TIFF",
}

export enum ProcessingStatus {
  PENDING = "PENDING", // 대기중
  IN_QUEUE = "IN_QUEUE", // 큐에서 대기
  PROCESSING = "PROCESSING", // 처리중
  COMPLETED = "COMPLETED", // 완료
  FAILED = "FAILED", // 실패
  CANCELLED = "CANCELLED", // 취소됨
}

@Entity("receipt_scans")
@Index("idx_receipt_scans_user", ["uploadedBy"])
@Index("idx_receipt_scans_organization", ["organizationId"])
@Index("idx_receipt_scans_status", ["status"])
@Index("idx_receipt_scans_type", ["receiptType"])
@Index("idx_receipt_scans_processing", ["processingStatus"])
@Index("idx_receipt_scans_date", ["receiptDate"])
@Index("idx_receipt_scans_upload_date", ["uploadedAt"])
@Index("idx_receipt_scans_filename", ["originalFileName"])
@Index("idx_receipt_scans_vendor", ["vendorName"])
export class ReceiptScan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "uploaded_by", comment: "업로드한 사용자" })
  @IsNotEmpty({ message: "업로드 사용자는 필수 입력 항목입니다." })
  @IsUUID(4, { message: "유효한 사용자 ID를 입력해주세요." })
  uploadedBy: string;

  @Column({ type: "uuid", name: "organization_id", comment: "연관 조직" })
  @IsNotEmpty({ message: "조직 ID는 필수 입력 항목입니다." })
  @IsUUID(4, { message: "유효한 조직 ID를 입력해주세요." })
  organizationId: string;

  @Column({
    type: "varchar",
    length: 255,
    name: "original_file_name",
    comment: "원본 파일명",
  })
  @IsNotEmpty({ message: "파일명은 필수 입력 항목입니다." })
  @Length(1, 255, { message: "파일명은 1자 이상 255자 이하로 입력해주세요." })
  originalFileName: string;

  @Column({
    type: "varchar",
    length: 500,
    name: "file_path",
    comment: "파일 저장 경로",
  })
  @IsNotEmpty({ message: "파일 경로는 필수 입력 항목입니다." })
  filePath: string;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
    name: "file_url",
    comment: "파일 URL",
  })
  @IsOptional()
  @IsUrl({}, { message: "유효한 URL을 입력해주세요." })
  fileUrl?: string;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
    name: "thumbnail_path",
    comment: "썸네일 경로",
  })
  @IsOptional()
  thumbnailPath?: string;

  @Column({
    type: "enum",
    enum: FileFormat,
    default: FileFormat.JPEG,
    comment: "파일 형식",
  })
  @IsEnum(FileFormat, { message: "유효한 파일 형식을 선택해주세요." })
  fileFormat: FileFormat;

  @Column({ type: "bigint", comment: "파일 크기 (bytes)" })
  @IsInt({ message: "파일 크기는 정수여야 합니다." })
  @Min(0, { message: "파일 크기는 0 이상이어야 합니다." })
  fileSize: number;

  @Column({
    type: "varchar",
    length: 64,
    nullable: true,
    comment: "파일 해시 (SHA-256)",
  })
  @IsOptional()
  fileHash?: string;

  @Column({
    type: "enum",
    enum: ReceiptType,
    default: ReceiptType.RECEIPT,
    comment: "영수증 유형",
  })
  @IsEnum(ReceiptType, { message: "유효한 영수증 유형을 선택해주세요." })
  receiptType: ReceiptType;

  @Column({
    type: "enum",
    enum: ReceiptStatus,
    default: ReceiptStatus.UPLOADED,
    comment: "영수증 상태",
  })
  @IsEnum(ReceiptStatus, { message: "유효한 영수증 상태를 선택해주세요." })
  status: ReceiptStatus;

  @Column({
    type: "enum",
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
    comment: "처리 상태",
  })
  @IsEnum(ProcessingStatus, { message: "유효한 처리 상태를 선택해주세요." })
  processingStatus: ProcessingStatus;

  @Column({ type: "integer", nullable: true, comment: "이미지 너비 (픽셀)" })
  @IsOptional()
  @IsInt({ message: "이미지 너비는 정수여야 합니다." })
  @Min(1, { message: "이미지 너비는 1 이상이어야 합니다." })
  imageWidth?: number;

  @Column({ type: "integer", nullable: true, comment: "이미지 높이 (픽셀)" })
  @IsOptional()
  @IsInt({ message: "이미지 높이는 정수여야 합니다." })
  @Min(1, { message: "이미지 높이는 1 이상이어야 합니다." })
  imageHeight?: number;

  @Column({ type: "integer", nullable: true, comment: "이미지 DPI" })
  @IsOptional()
  @IsInt({ message: "DPI는 정수여야 합니다." })
  @Min(72, { message: "DPI는 72 이상이어야 합니다." })
  imageDpi?: number;

  @Column({ type: "date", nullable: true, comment: "영수증 날짜" })
  @IsOptional()
  receiptDate?: Date;

  @Column({ type: "varchar", length: 100, nullable: true, comment: "업체명" })
  @IsOptional()
  @Length(1, 100, { message: "업체명은 1자 이상 100자 이하로 입력해주세요." })
  vendorName?: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "업체 전화번호",
  })
  @IsOptional()
  vendorPhone?: string;

  @Column({ type: "text", nullable: true, comment: "업체 주소" })
  @IsOptional()
  vendorAddress?: string;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    comment: "총 금액",
  })
  @IsOptional()
  totalAmount?: number;

  @Column({ type: "varchar", length: 3, default: "KRW", comment: "통화" })
  currency: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "영수증 번호",
  })
  @IsOptional()
  receiptNumber?: string;

  @Column({
    type: "integer",
    nullable: true,
    comment: "이미지 품질 점수 (0-100)",
  })
  @IsOptional()
  @IsInt({ message: "품질 점수는 정수여야 합니다." })
  @Min(0, { message: "품질 점수는 0 이상이어야 합니다." })
  @Max(100, { message: "품질 점수는 100 이하여야 합니다." })
  imageQualityScore?: number;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    comment: "OCR 신뢰도 (0-1)",
  })
  @IsOptional()
  ocrConfidence?: number;

  @Column({ type: "text", nullable: true, comment: "OCR 원본 텍스트" })
  @IsOptional()
  rawOcrText?: string;

  @Column({ type: "jsonb", nullable: true, comment: "이미지 EXIF 데이터" })
  exifData?: {
    make?: string;
    model?: string;
    dateTime?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    orientation?: number;
    software?: string;
    [key: string]: any;
  };

  @Column({ type: "jsonb", nullable: true, comment: "처리 로그" })
  processingLog?: Array<{
    step: string;
    status: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    details?: string;
    error?: string;
  }>;

  @Column({ type: "jsonb", nullable: true, comment: "품질 분석 결과" })
  qualityAnalysis?: {
    clarity?: number;
    brightness?: number;
    contrast?: number;
    blur?: number;
    noise?: number;
    rotation?: number;
    skew?: number;
    completeness?: number;
    recommendations?: string[];
    issues?: Array<{
      type: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      description: string;
      solution?: string;
    }>;
  };

  @Column({ type: "jsonb", nullable: true, comment: "메타데이터" })
  metadata?: {
    tags?: string[];
    category?: string;
    project?: string;
    costCenter?: string;
    uploadSource?: "WEB" | "MOBILE" | "EMAIL" | "API";
    deviceInfo?: {
      type?: string;
      os?: string;
      browser?: string;
      version?: string;
    };
    location?: {
      latitude?: number;
      longitude?: number;
      address?: string;
      timestamp?: Date;
    };
    duplicateChecksum?: string;
    originalProcessingTime?: number;
    retryCount?: number;
    [key: string]: any;
  };

  @Column({ type: "text", nullable: true, comment: "에러 메시지" })
  @IsOptional()
  errorMessage?: string;

  @Column({ type: "text", nullable: true, comment: "사용자 메모" })
  @IsOptional()
  userNotes?: string;

  @Column({ type: "timestamp", nullable: true, comment: "처리 시작 시간" })
  processingStartedAt?: Date;

  @Column({ type: "timestamp", nullable: true, comment: "처리 완료 시간" })
  processingCompletedAt?: Date;

  @Column({
    type: "timestamp",
    name: "uploaded_at",
    default: () => "CURRENT_TIMESTAMP",
    comment: "업로드 시간",
  })
  uploadedAt: Date;

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
  @ManyToOne(() => User, (user) => user.receiptScans, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "uploaded_by" })
  uploader: User;

  @ManyToOne(() => Organization, (organization) => organization.receiptScans, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  @OneToOne(() => OcrResult, (ocrResult) => ocrResult.receiptScan, {
    cascade: true,
  })
  ocrResult?: OcrResult;

  @OneToMany(() => SettlementItem, (item) => item.receiptScan)
  settlementItems: SettlementItem[];

  @OneToOne(() => ReceiptValidation, (validation) => validation.receiptScan, {
    cascade: true,
  })
  validation?: ReceiptValidation;

  // 가상 속성
  get processingDuration(): number | null {
    if (!this.processingStartedAt || !this.processingCompletedAt) return null;
    return (
      this.processingCompletedAt.getTime() - this.processingStartedAt.getTime()
    );
  }

  get processingDurationInSeconds(): number | null {
    const duration = this.processingDuration;
    return duration ? Math.floor(duration / 1000) : null;
  }

  get isProcessing(): boolean {
    return (
      this.processingStatus === ProcessingStatus.PROCESSING ||
      this.processingStatus === ProcessingStatus.IN_QUEUE
    );
  }

  get isProcessed(): boolean {
    return this.processingStatus === ProcessingStatus.COMPLETED;
  }

  get hasFailed(): boolean {
    return (
      this.processingStatus === ProcessingStatus.FAILED ||
      this.status === ReceiptStatus.ERROR
    );
  }

  get isValidated(): boolean {
    return this.status === ReceiptStatus.VALIDATED;
  }

  get fileSizeInMB(): number {
    return Math.round((this.fileSize / (1024 * 1024)) * 100) / 100;
  }

  get aspectRatio(): number | null {
    if (!this.imageWidth || !this.imageHeight) return null;
    return this.imageWidth / this.imageHeight;
  }

  get megapixels(): number | null {
    if (!this.imageWidth || !this.imageHeight) return null;
    return (
      Math.round(((this.imageWidth * this.imageHeight) / 1000000) * 10) / 10
    );
  }

  get isHighQuality(): boolean {
    if (!this.imageQualityScore) return false;
    return this.imageQualityScore >= 80;
  }

  get isLowQuality(): boolean {
    if (!this.imageQualityScore) return false;
    return this.imageQualityScore < 60;
  }

  get hasOcrData(): boolean {
    return this.ocrResult !== null && this.ocrResult !== undefined;
  }

  get timeSinceUpload(): number {
    return Date.now() - this.uploadedAt.getTime();
  }

  get daysSinceUpload(): number {
    return Math.floor(this.timeSinceUpload / (1000 * 60 * 60 * 24));
  }

  // 비즈니스 메서드
  startProcessing(): void {
    this.processingStatus = ProcessingStatus.PROCESSING;
    this.processingStartedAt = new Date();
    this.addProcessingLog(
      "PROCESSING_STARTED",
      "SUCCESS",
      "Processing started"
    );
  }

  completeProcessing(): void {
    this.processingStatus = ProcessingStatus.COMPLETED;
    this.processingCompletedAt = new Date();
    this.status = ReceiptStatus.OCR_COMPLETED;
    this.addProcessingLog(
      "PROCESSING_COMPLETED",
      "SUCCESS",
      "Processing completed successfully"
    );
  }

  failProcessing(error: string): void {
    this.processingStatus = ProcessingStatus.FAILED;
    this.processingCompletedAt = new Date();
    this.status = ReceiptStatus.ERROR;
    this.errorMessage = error;
    this.addProcessingLog(
      "PROCESSING_FAILED",
      "FAILURE",
      `Processing failed: ${error}`
    );
  }

  validate(): void {
    this.status = ReceiptStatus.VALIDATED;
  }

  reject(reason?: string): void {
    this.status = ReceiptStatus.REJECTED;
    if (reason) this.errorMessage = reason;
  }

  archive(): void {
    this.status = ReceiptStatus.ARCHIVED;
    this.isActive = false;
  }

  addProcessingLog(
    step: string,
    status: string,
    details?: string,
    error?: string
  ): void {
    if (!this.processingLog) this.processingLog = [];

    const lastLog = this.processingLog[this.processingLog.length - 1];
    if (lastLog && !lastLog.endTime) {
      lastLog.endTime = new Date();
      lastLog.duration =
        lastLog.endTime.getTime() - lastLog.startTime.getTime();
    }

    this.processingLog.push({
      step,
      status,
      startTime: new Date(),
      details,
      error,
    });
  }

  updateQualityAnalysis(analysis: ReceiptScan["qualityAnalysis"]): void {
    this.qualityAnalysis = {
      ...this.qualityAnalysis,
      ...analysis,
    };

    // 전체 품질 점수 계산
    if (
      analysis?.clarity !== undefined &&
      analysis?.brightness !== undefined &&
      analysis?.contrast !== undefined &&
      analysis?.completeness !== undefined
    ) {
      this.imageQualityScore = Math.round(
        (analysis.clarity * 0.3 +
          analysis.brightness * 0.2 +
          analysis.contrast * 0.2 +
          analysis.completeness * 0.3) *
          100
      );
    }
  }

  updateMetadata(newMetadata: Partial<ReceiptScan["metadata"]>): void {
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

  incrementRetryCount(): void {
    if (!this.metadata) this.metadata = {};
    this.metadata.retryCount = (this.metadata.retryCount || 0) + 1;
  }

  canRetry(): boolean {
    const maxRetries = 3;
    return (
      (this.metadata?.retryCount || 0) < maxRetries &&
      this.processingStatus === ProcessingStatus.FAILED
    );
  }

  getReceiptTypeDisplayName(): string {
    const typeNames = {
      [ReceiptType.PURCHASE]: "구매영수증",
      [ReceiptType.INVOICE]: "청구서",
      [ReceiptType.RECEIPT]: "일반영수증",
      [ReceiptType.CREDIT_CARD]: "카드전표",
      [ReceiptType.CASH_RECEIPT]: "현금영수증",
      [ReceiptType.TAX_INVOICE]: "세금계산서",
      [ReceiptType.SIMPLE_RECEIPT]: "간이영수증",
      [ReceiptType.OTHER]: "기타",
    };
    return typeNames[this.receiptType] || this.receiptType;
  }

  getStatusDisplayName(): string {
    const statusNames = {
      [ReceiptStatus.UPLOADED]: "업로드됨",
      [ReceiptStatus.PROCESSING]: "처리중",
      [ReceiptStatus.OCR_COMPLETED]: "OCR완료",
      [ReceiptStatus.VALIDATED]: "검증완료",
      [ReceiptStatus.ERROR]: "오류",
      [ReceiptStatus.REJECTED]: "반려됨",
      [ReceiptStatus.ARCHIVED]: "보관됨",
    };
    return statusNames[this.status] || this.status;
  }

  getProcessingStatusDisplayName(): string {
    const statusNames = {
      [ProcessingStatus.PENDING]: "대기중",
      [ProcessingStatus.IN_QUEUE]: "큐대기",
      [ProcessingStatus.PROCESSING]: "처리중",
      [ProcessingStatus.COMPLETED]: "완료",
      [ProcessingStatus.FAILED]: "실패",
      [ProcessingStatus.CANCELLED]: "취소됨",
    };
    return statusNames[this.processingStatus] || this.processingStatus;
  }
}
