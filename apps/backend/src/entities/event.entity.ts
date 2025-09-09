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
  IsUrl,
} from "class-validator";
import { Organization } from "./organization.entity";
import { Budget } from "./budget.entity";
import { Settlement } from "./settlement.entity";

export enum EventType {
  REGULAR = "REGULAR", // 정기 행사
  SPECIAL = "SPECIAL", // 특별 행사
  FUNDRAISING = "FUNDRAISING", // 모금 행사
  WORSHIP = "WORSHIP", // 예배 행사
  FELLOWSHIP = "FELLOWSHIP", // 친교 행사
  EDUCATION = "EDUCATION", // 교육 행사
  OUTREACH = "OUTREACH", // 전도 행사
  SERVICE = "SERVICE", // 봉사 행사
  RETREAT = "RETREAT", // 수련회/성회
  CONFERENCE = "CONFERENCE", // 컨퍼런스
  OTHER = "OTHER", // 기타
}

export enum EventStatus {
  DRAFT = "DRAFT", // 초안
  PLANNED = "PLANNED", // 계획됨
  APPROVED = "APPROVED", // 승인됨
  IN_PROGRESS = "IN_PROGRESS", // 진행중
  COMPLETED = "COMPLETED", // 완료
  CANCELLED = "CANCELLED", // 취소
  POSTPONED = "POSTPONED", // 연기
}

export enum EventVisibility {
  PUBLIC = "PUBLIC", // 공개
  PRIVATE = "PRIVATE", // 비공개
  MEMBERS_ONLY = "MEMBERS_ONLY", // 회원 전용
}

@Entity("events")
@Index("idx_events_organization", ["organizationId"])
@Index("idx_events_type", ["type"])
@Index("idx_events_status", ["status"])
@Index("idx_events_start_date", ["startDate"])
@Index("idx_events_end_date", ["endDate"])
@Index("idx_events_visibility", ["visibility"])
@Index("idx_events_title_search", ["title"])
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "organization_id" })
  @IsNotEmpty({ message: "조직 ID는 필수 입력 항목입니다." })
  organizationId: string;

  @Column({
    type: "uuid",
    nullable: true,
    name: "created_by",
    comment: "생성자 ID",
  })
  createdBy?: string;

  @Column({
    type: "uuid",
    nullable: true,
    name: "approved_by",
    comment: "승인자 ID",
  })
  approvedBy?: string;

  @Column({ type: "varchar", length: 200 })
  @IsNotEmpty({ message: "행사명은 필수 입력 항목입니다." })
  @Length(2, 200, { message: "행사명은 2자 이상 200자 이하로 입력해주세요." })
  title: string;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  description?: string;

  @Column({
    type: "enum",
    enum: EventType,
    default: EventType.REGULAR,
  })
  @IsEnum(EventType, { message: "유효한 행사 유형을 선택해주세요." })
  type: EventType;

  @Column({
    type: "enum",
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  @IsEnum(EventStatus, { message: "유효한 행사 상태를 선택해주세요." })
  status: EventStatus;

  @Column({
    type: "enum",
    enum: EventVisibility,
    default: EventVisibility.MEMBERS_ONLY,
  })
  @IsEnum(EventVisibility, { message: "유효한 공개 설정을 선택해주세요." })
  visibility: EventVisibility;

  @Column({ type: "date", comment: "행사 시작일" })
  @IsNotEmpty({ message: "시작일은 필수 입력 항목입니다." })
  @IsDate({ message: "유효한 시작일을 입력해주세요." })
  startDate: Date;

  @Column({ type: "date", comment: "행사 종료일" })
  @IsNotEmpty({ message: "종료일은 필수 입력 항목입니다." })
  @IsDate({ message: "유효한 종료일을 입력해주세요." })
  endDate: Date;

  @Column({ type: "time", nullable: true, comment: "행사 시작 시간" })
  @IsOptional()
  startTime?: string;

  @Column({ type: "time", nullable: true, comment: "행사 종료 시간" })
  @IsOptional()
  endTime?: string;

  @Column({
    type: "varchar",
    length: 200,
    nullable: true,
    comment: "행사 장소",
  })
  @IsOptional()
  @Length(1, 200, { message: "장소는 1자 이상 200자 이하로 입력해주세요." })
  location?: string;

  @Column({ type: "text", nullable: true, comment: "장소 상세 주소" })
  @IsOptional()
  locationDetails?: string;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
    comment: "예상 참가비",
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "유효한 참가비를 입력해주세요." }
  )
  @Min(0, { message: "참가비는 0 이상이어야 합니다." })
  estimatedCost?: number;

  @Column({ type: "integer", nullable: true, comment: "최대 참가자 수" })
  @IsOptional()
  @Min(1, { message: "최대 참가자 수는 1 이상이어야 합니다." })
  maxParticipants?: number;

  @Column({ type: "integer", default: 0, comment: "현재 참가자 수" })
  currentParticipants: number;

  @Column({ type: "varchar", length: 3, default: "KRW" })
  currency: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "담당자 이름",
  })
  @IsOptional()
  responsiblePerson?: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "담당자 연락처",
  })
  @IsOptional()
  responsibleContact?: string;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
    comment: "웹사이트 또는 세부 정보 URL",
  })
  @IsOptional()
  @IsUrl({}, { message: "유효한 URL을 입력해주세요." })
  websiteUrl?: string;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
    comment: "이벤트 이미지 URL",
  })
  @IsOptional()
  imageUrl?: string;

  @Column({ type: "jsonb", nullable: true, comment: "추가 메타데이터" })
  metadata?: {
    tags?: string[];
    categories?: string[];
    requirements?: string[];
    materials?: string[];
    agenda?: Array<{
      time: string;
      title: string;
      description?: string;
      speaker?: string;
    }>;
    [key: string]: any;
  };

  @Column({ type: "text", nullable: true, comment: "특이사항 및 메모" })
  @IsOptional()
  notes?: string;

  @Column({ type: "timestamp", nullable: true, comment: "승인 시간" })
  approvedAt?: Date;

  @Column({ type: "boolean", default: false, comment: "취소 여부" })
  isCancelled: boolean;

  @Column({ type: "text", nullable: true, comment: "취소 사유" })
  @IsOptional()
  cancellationReason?: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "행사 생성 시간",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "마지막 수정 시간",
  })
  updatedAt: Date;

  // 관계 설정
  @ManyToOne(() => Organization, (organization) => organization.events, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  @OneToMany(() => Budget, (budget) => budget.event)
  budgets: Budget[];

  @OneToMany(() => Settlement, (settlement) => settlement.event)
  settlements: Settlement[];

  // 가상 속성
  get duration(): number {
    return this.endDate.getTime() - this.startDate.getTime();
  }

  get durationInDays(): number {
    return Math.ceil(this.duration / (1000 * 60 * 60 * 24));
  }

  get isUpcoming(): boolean {
    return this.startDate > new Date();
  }

  get isOngoing(): boolean {
    const now = new Date();
    return this.startDate <= now && now <= this.endDate;
  }

  get isPast(): boolean {
    return this.endDate < new Date();
  }

  get isFullyBooked(): boolean {
    return (
      this.maxParticipants !== null &&
      this.currentParticipants >= this.maxParticipants
    );
  }

  get availableSlots(): number | null {
    if (this.maxParticipants === null) return null;
    return Math.max(0, this.maxParticipants - this.currentParticipants);
  }

  get canRegister(): boolean {
    return (
      this.status === EventStatus.APPROVED &&
      !this.isCancelled &&
      this.isUpcoming &&
      !this.isFullyBooked &&
      this.visibility !== EventVisibility.PRIVATE
    );
  }

  // 비즈니스 메서드
  approve(approvedBy: string): void {
    this.status = EventStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
  }

  start(): void {
    if (this.status === EventStatus.APPROVED) {
      this.status = EventStatus.IN_PROGRESS;
    }
  }

  complete(): void {
    this.status = EventStatus.COMPLETED;
  }

  cancel(reason?: string): void {
    this.status = EventStatus.CANCELLED;
    this.isCancelled = true;
    this.cancellationReason = reason;
  }

  postpone(): void {
    this.status = EventStatus.POSTPONED;
  }

  addParticipant(): void {
    if (this.canRegister) {
      this.currentParticipants += 1;
    }
  }

  removeParticipant(): void {
    this.currentParticipants = Math.max(0, this.currentParticipants - 1);
  }

  updateMetadata(newMetadata: Partial<Event["metadata"]>): void {
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

  getTypeDisplayName(): string {
    const typeNames = {
      [EventType.REGULAR]: "정기 행사",
      [EventType.SPECIAL]: "특별 행사",
      [EventType.FUNDRAISING]: "모금 행사",
      [EventType.WORSHIP]: "예배 행사",
      [EventType.FELLOWSHIP]: "친교 행사",
      [EventType.EDUCATION]: "교육 행사",
      [EventType.OUTREACH]: "전도 행사",
      [EventType.SERVICE]: "봉사 행사",
      [EventType.RETREAT]: "수련회/성회",
      [EventType.CONFERENCE]: "컨퍼런스",
      [EventType.OTHER]: "기타",
    };
    return typeNames[this.type] || this.type;
  }

  getStatusDisplayName(): string {
    const statusNames = {
      [EventStatus.DRAFT]: "초안",
      [EventStatus.PLANNED]: "계획됨",
      [EventStatus.APPROVED]: "승인됨",
      [EventStatus.IN_PROGRESS]: "진행중",
      [EventStatus.COMPLETED]: "완료",
      [EventStatus.CANCELLED]: "취소",
      [EventStatus.POSTPONED]: "연기",
    };
    return statusNames[this.status] || this.status;
  }
}
