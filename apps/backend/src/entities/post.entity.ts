import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  DeleteDateColumn,
} from "typeorm";
import {
  IsNotEmpty,
  Length,
  IsEnum,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { User } from "./user.entity";
import { Organization } from "./organization.entity";

export enum PostCategory {
  NEWS = "NEWS", // 소식
  NOTICE = "NOTICE", // 공지사항
  EVENT = "EVENT", // 행사
  TESTIMONY = "TESTIMONY", // 간증
  DEVOTION = "DEVOTION", // 묵상
  TEACHING = "TEACHING", // 가르침
  ANNOUNCEMENT = "ANNOUNCEMENT", // 알림
  GENERAL = "GENERAL", // 일반
}

export enum PostStatus {
  DRAFT = "DRAFT", // 임시저장
  PUBLISHED = "PUBLISHED", // 게시됨
  SCHEDULED = "SCHEDULED", // 예약발행
  ARCHIVED = "ARCHIVED", // 보관됨
}

export enum PostVisibility {
  PUBLIC = "PUBLIC", // 공개
  MEMBERS_ONLY = "MEMBERS_ONLY", // 회원 전용
  ORGANIZATION_ONLY = "ORGANIZATION_ONLY", // 조직 전용
  PRIVATE = "PRIVATE", // 비공개
}

@Entity("posts")
@Index("idx_posts_organization", ["organizationId"])
@Index("idx_posts_author", ["authorId"])
@Index("idx_posts_category", ["category"])
@Index("idx_posts_status", ["status"])
@Index("idx_posts_visibility", ["visibility"])
@Index("idx_posts_published_date", ["publishedAt"])
@Index("idx_posts_title_search", ["title"])
export class Post {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "organization_id" })
  @IsNotEmpty({ message: "조직 ID는 필수 입력 항목입니다." })
  organizationId: string;

  @Column({ type: "uuid", name: "author_id", comment: "작성자 ID" })
  @IsNotEmpty({ message: "작성자 ID는 필수 입력 항목입니다." })
  authorId: string;

  @Column({ type: "varchar", length: 200, comment: "포스트 제목" })
  @IsNotEmpty({ message: "포스트 제목은 필수 입력 항목입니다." })
  @Length(2, 200, {
    message: "포스트 제목은 2자 이상 200자 이하로 입력해주세요.",
  })
  title: string;

  @Column({ type: "text", nullable: true, comment: "포스트 요약" })
  @IsOptional()
  summary?: string;

  @Column({ type: "text", comment: "포스트 본문" })
  @IsNotEmpty({ message: "포스트 본문은 필수 입력 항목입니다." })
  content: string;

  @Column({
    type: "enum",
    enum: PostCategory,
    default: PostCategory.GENERAL,
    comment: "포스트 카테고리",
  })
  @IsEnum(PostCategory, { message: "유효한 포스트 카테고리를 선택해주세요." })
  category: PostCategory;

  @Column({
    type: "enum",
    enum: PostStatus,
    default: PostStatus.DRAFT,
    comment: "포스트 상태",
  })
  @IsEnum(PostStatus, { message: "유효한 포스트 상태를 선택해주세요." })
  status: PostStatus;

  @Column({
    type: "enum",
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
    comment: "포스트 공개 범위",
  })
  @IsEnum(PostVisibility, {
    message: "유효한 포스트 공개 범위를 선택해주세요.",
  })
  visibility: PostVisibility;

  @Column({ type: "varchar", length: 255, nullable: true, comment: "썸네일 URL" })
  @IsOptional()
  thumbnailUrl?: string;

  @Column({ type: "jsonb", nullable: true, comment: "태그 목록" })
  tags?: string[];

  @Column({ type: "integer", default: 0, comment: "조회수" })
  viewCount: number;

  @Column({ type: "integer", default: 0, comment: "좋아요 수" })
  likeCount: number;

  @Column({ type: "boolean", default: false, comment: "고정 게시물 여부" })
  @IsBoolean()
  isPinned: boolean;

  @Column({
    type: "boolean",
    default: true,
    comment: "댓글 허용 여부",
  })
  @IsBoolean()
  allowComments: boolean;

  @Column({ type: "timestamp", nullable: true, comment: "발행 시간" })
  publishedAt?: Date;

  @Column({ type: "timestamp", nullable: true, comment: "예약 발행 시간" })
  scheduledAt?: Date;

  @Column({ type: "jsonb", nullable: true, comment: "추가 메타데이터" })
  metadata?: {
    readTime?: number;
    featuredImageAlt?: string;
    seoTitle?: string;
    seoDescription?: string;
    customFields?: Record<string, any>;
    [key: string]: any;
  };

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

  @DeleteDateColumn({
    type: "timestamp",
    nullable: true,
    comment: "삭제 시간 (소프트 삭제)",
  })
  deletedAt?: Date;

  // 관계 설정
  @ManyToOne(() => Organization, (organization) => organization.posts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "author_id" })
  author: User;

  // 가상 속성
  get isPublished(): boolean {
    return this.status === PostStatus.PUBLISHED;
  }

  get isDraft(): boolean {
    return this.status === PostStatus.DRAFT;
  }

  get isScheduled(): boolean {
    return this.status === PostStatus.SCHEDULED;
  }

  // 비즈니스 메서드
  publish(): void {
    this.status = PostStatus.PUBLISHED;
    if (!this.publishedAt) {
      this.publishedAt = new Date();
    }
  }

  unpublish(): void {
    this.status = PostStatus.DRAFT;
  }

  archive(): void {
    this.status = PostStatus.ARCHIVED;
  }

  schedulePublish(scheduledAt: Date): void {
    this.status = PostStatus.SCHEDULED;
    this.scheduledAt = scheduledAt;
  }

  incrementViewCount(): void {
    this.viewCount += 1;
  }

  incrementLikeCount(): void {
    this.likeCount += 1;
  }

  decrementLikeCount(): void {
    if (this.likeCount > 0) {
      this.likeCount -= 1;
    }
  }

  pin(): void {
    this.isPinned = true;
  }

  unpin(): void {
    this.isPinned = false;
  }

  addTag(tag: string): void {
    if (!this.tags) {
      this.tags = [];
    }
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  removeTag(tag: string): void {
    if (this.tags) {
      this.tags = this.tags.filter((t) => t !== tag);
    }
  }

  getCategoryDisplayName(): string {
    const categoryNames = {
      [PostCategory.NEWS]: "소식",
      [PostCategory.NOTICE]: "공지사항",
      [PostCategory.EVENT]: "행사",
      [PostCategory.TESTIMONY]: "간증",
      [PostCategory.DEVOTION]: "묵상",
      [PostCategory.TEACHING]: "가르침",
      [PostCategory.ANNOUNCEMENT]: "알림",
      [PostCategory.GENERAL]: "일반",
    };
    return categoryNames[this.category] || this.category;
  }
}
