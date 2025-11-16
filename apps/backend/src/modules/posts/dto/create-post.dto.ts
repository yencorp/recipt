import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Length,
  IsString,
  IsBoolean,
  IsArray,
  IsDate,
} from "class-validator";
import { Type } from "class-transformer";
import {
  PostCategory,
  PostStatus,
  PostVisibility,
} from "../../../entities/post.entity";

export class CreatePostDto {
  @ApiProperty({ description: "조직 ID" })
  @IsNotEmpty({ message: "조직 ID는 필수입니다." })
  organizationId: string;

  @ApiProperty({ description: "작성자 ID" })
  @IsNotEmpty({ message: "작성자 ID는 필수입니다." })
  authorId: string;

  @ApiProperty({ description: "포스트 제목", example: "2025년 새해 인사" })
  @IsNotEmpty({ message: "포스트 제목은 필수입니다." })
  @Length(2, 200)
  title: string;

  @ApiProperty({ description: "포스트 요약", required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: "포스트 본문" })
  @IsNotEmpty({ message: "포스트 본문은 필수입니다." })
  @IsString()
  content: string;

  @ApiProperty({
    description: "포스트 카테고리",
    enum: PostCategory,
    default: PostCategory.GENERAL,
  })
  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @ApiProperty({
    description: "포스트 상태",
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiProperty({
    description: "포스트 공개 범위",
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiProperty({ description: "썸네일 URL", required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ description: "태그 목록", required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ description: "고정 게시물 여부", required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiProperty({ description: "댓글 허용 여부", required: false })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiProperty({ description: "예약 발행 시간", required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;
}
