import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { PostsService } from "./posts.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { AdminOnly } from "../auth/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Posts")
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "포스트 목록 조회 (공개)" })
  @ApiQuery({
    name: "organizationId",
    required: false,
    description: "조직 ID로 필터링",
  })
  @ApiQuery({
    name: "category",
    required: false,
    description: "카테고리로 필터링",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "상태로 필터링",
  })
  @ApiQuery({
    name: "visibility",
    required: false,
    description: "공개 범위로 필터링",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "제목 또는 본문 검색",
  })
  @ApiQuery({ name: "page", required: false, description: "페이지 번호" })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "페이지당 개수",
  })
  @ApiResponse({ status: 200, description: "포스트 목록 조회 성공" })
  async findAll(
    @Query("organizationId") organizationId?: string,
    @Query("category") category?: string,
    @Query("status") status?: string,
    @Query("visibility") visibility?: string,
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.postsService.findAll({
      organizationId,
      category,
      status,
      visibility,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "포스트 상세 조회 (공개)" })
  @ApiResponse({ status: 200, description: "포스트 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "포스트를 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    const post = await this.postsService.findOne(id);
    // 조회수 증가
    await this.postsService.incrementViewCount(id);
    return post;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiOperation({ summary: "포스트 생성 (관리자 전용)" })
  @ApiResponse({ status: 201, description: "포스트 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  @ApiResponse({ status: 403, description: "권한 없음" })
  async create(@Body() createDto: CreatePostDto) {
    return this.postsService.create(createDto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiOperation({ summary: "포스트 수정 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "포스트 수정 성공" })
  @ApiResponse({ status: 404, description: "포스트를 찾을 수 없음" })
  @ApiResponse({ status: 403, description: "권한 없음" })
  async update(@Param("id") id: string, @Body() updateDto: UpdatePostDto) {
    return this.postsService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiOperation({ summary: "포스트 삭제 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "포스트 삭제 성공" })
  @ApiResponse({ status: 404, description: "포스트를 찾을 수 없음" })
  @ApiResponse({ status: 403, description: "권한 없음" })
  async remove(@Param("id") id: string) {
    return this.postsService.remove(id);
  }

  @Put(":id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "포스트 발행 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "포스트 발행 성공" })
  @ApiResponse({ status: 404, description: "포스트를 찾을 수 없음" })
  async publish(@Param("id") id: string) {
    return this.postsService.publish(id);
  }

  @Put(":id/unpublish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "포스트 발행 취소 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "포스트 발행 취소 성공" })
  @ApiResponse({ status: 404, description: "포스트를 찾을 수 없음" })
  async unpublish(@Param("id") id: string) {
    return this.postsService.unpublish(id);
  }

  @Put(":id/toggle-pin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "포스트 고정/고정 해제 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "포스트 고정 상태 변경 성공" })
  @ApiResponse({ status: 404, description: "포스트를 찾을 수 없음" })
  async togglePin(@Param("id") id: string) {
    return this.postsService.togglePin(id);
  }

  @Get("category/:category")
  @Public()
  @ApiOperation({ summary: "카테고리별 포스트 조회 (공개)" })
  @ApiQuery({ name: "page", required: false, description: "페이지 번호" })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "페이지당 개수",
  })
  @ApiResponse({
    status: 200,
    description: "카테고리별 포스트 조회 성공",
  })
  async findByCategory(
    @Param("category") category: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.postsService.findByCategory(
      category,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10
    );
  }
}
