import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Post, PostStatus } from "../../entities/post.entity";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";

export interface PostFilterDto {
  organizationId?: string;
  category?: string;
  status?: string;
  visibility?: string;
  authorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>
  ) {}

  async findAll(filterDto?: PostFilterDto) {
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.organization", "organization");

    // 필터링
    if (filterDto?.organizationId) {
      query.andWhere("post.organizationId = :organizationId", {
        organizationId: filterDto.organizationId,
      });
    }

    if (filterDto?.category) {
      query.andWhere("post.category = :category", {
        category: filterDto.category,
      });
    }

    if (filterDto?.status) {
      query.andWhere("post.status = :status", {
        status: filterDto.status,
      });
    }

    if (filterDto?.visibility) {
      query.andWhere("post.visibility = :visibility", {
        visibility: filterDto.visibility,
      });
    }

    if (filterDto?.authorId) {
      query.andWhere("post.authorId = :authorId", {
        authorId: filterDto.authorId,
      });
    }

    if (filterDto?.search) {
      query.andWhere(
        "(post.title LIKE :search OR post.content LIKE :search)",
        {
          search: `%${filterDto.search}%`,
        }
      );
    }

    // 정렬: 고정 게시물 우선, 발행일 기준
    query
      .orderBy("post.isPinned", "DESC")
      .addOrderBy("post.publishedAt", "DESC")
      .addOrderBy("post.createdAt", "DESC");

    // 페이징
    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ["author", "organization"],
    });

    if (!post) {
      throw new NotFoundException("포스트를 찾을 수 없습니다.");
    }

    return post;
  }

  async create(createDto: CreatePostDto) {
    const post = this.postRepository.create(createDto);

    // 발행 상태이면 발행 시간 설정
    if (createDto.status === PostStatus.PUBLISHED && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    return this.postRepository.save(post);
  }

  async update(id: string, updateDto: UpdatePostDto) {
    const post = await this.findOne(id);

    // 상태가 PUBLISHED로 변경되면 발행 시간 설정
    if (
      updateDto.status === PostStatus.PUBLISHED &&
      post.status !== PostStatus.PUBLISHED &&
      !post.publishedAt
    ) {
      updateDto["publishedAt"] = new Date();
    }

    await this.postRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const post = await this.findOne(id);
    await this.postRepository.softRemove(post);
    return { message: "포스트가 삭제되었습니다.", id };
  }

  // 조회수 증가
  async incrementViewCount(id: string) {
    await this.postRepository.increment({ id }, "viewCount", 1);
    return this.findOne(id);
  }

  // 발행
  async publish(id: string) {
    const post = await this.findOne(id);
    post.publish();
    return this.postRepository.save(post);
  }

  // 발행 취소
  async unpublish(id: string) {
    const post = await this.findOne(id);
    post.unpublish();
    return this.postRepository.save(post);
  }

  // 고정/고정 해제
  async togglePin(id: string) {
    const post = await this.findOne(id);
    post.isPinned ? post.unpin() : post.pin();
    return this.postRepository.save(post);
  }

  // 카테고리별 포스트 조회
  async findByCategory(category: string, page = 1, limit = 10) {
    return this.findAll({ category, page, limit });
  }
}
