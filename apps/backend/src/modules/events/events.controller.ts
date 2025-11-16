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
  Request,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { EventsService } from "./events.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { OrgAdminOnly } from "../auth/roles.decorator";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { EventFilterDto } from "./dto/event-filter.dto";
import { CacheInterceptor } from "../../common/interceptors/cache.interceptor";
import { CacheKey, CacheTTL } from "../../common/decorators/cache.decorator";

@ApiTags("Events")
@Controller("events")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT")
@UseInterceptors(CacheInterceptor)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: "행사 생성" })
  @ApiResponse({ status: 201, description: "행사 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async create(@Body() createEventDto: CreateEventDto, @Request() req: any) {
    return this.eventsService.create(createEventDto, req.user.id);
  }

  @Get()
  @CacheKey("events:list")
  @CacheTTL(300) // 5분 캐시
  @ApiOperation({ summary: "행사 목록 조회 (필터링, 페이징)" })
  @ApiResponse({ status: 200, description: "행사 목록 조회 성공" })
  @ApiQuery({ name: "organizationId", required: false })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  async findAll(@Query() filterDto: EventFilterDto) {
    return this.eventsService.findAll(filterDto);
  }

  @Get(":id")
  @CacheKey("events:detail")
  @CacheTTL(600) // 10분 캐시
  @ApiOperation({ summary: "행사 상세 조회" })
  @ApiResponse({ status: 200, description: "행사 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "행사를 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.eventsService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "행사 정보 수정 (작성자/관리자)" })
  @ApiResponse({ status: 200, description: "행사 정보 수정 성공" })
  @ApiResponse({ status: 404, description: "행사를 찾을 수 없음" })
  async update(
    @Param("id") id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: any,
  ) {
    return this.eventsService.update(id, updateEventDto, req.user.id);
  }

  @Delete(":id")
  @OrgAdminOnly()
  @ApiOperation({ summary: "행사 삭제 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "행사 삭제 성공" })
  @ApiResponse({ status: 403, description: "예산/정산이 있는 행사는 삭제 불가" })
  @ApiResponse({ status: 404, description: "행사를 찾을 수 없음" })
  async remove(@Param("id") id: string, @Request() req: any) {
    return this.eventsService.remove(id, req.user.id);
  }

  // 상태 관리 엔드포인트
  @Put(":id/approve")
  @OrgAdminOnly()
  @ApiOperation({ summary: "행사 승인 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "행사 승인 성공" })
  async approve(@Param("id") id: string, @Request() req: any) {
    return this.eventsService.approve(id, req.user.id);
  }

  @Put(":id/start")
  @OrgAdminOnly()
  @ApiOperation({ summary: "행사 시작 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "행사 시작 성공" })
  async start(@Param("id") id: string) {
    return this.eventsService.start(id);
  }

  @Put(":id/complete")
  @OrgAdminOnly()
  @ApiOperation({ summary: "행사 완료 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "행사 완료 성공" })
  async complete(@Param("id") id: string) {
    return this.eventsService.complete(id);
  }

  @Put(":id/cancel")
  @OrgAdminOnly()
  @ApiOperation({ summary: "행사 취소 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "행사 취소 성공" })
  async cancel(
    @Param("id") id: string,
    @Body("reason") reason?: string,
  ) {
    return this.eventsService.cancel(id, reason);
  }

  @Put(":id/postpone")
  @OrgAdminOnly()
  @ApiOperation({ summary: "행사 연기 (관리자 전용)" })
  @ApiResponse({ status: 200, description: "행사 연기 성공" })
  async postpone(@Param("id") id: string) {
    return this.eventsService.postpone(id);
  }

  @Get("organization/:organizationId")
  @ApiOperation({ summary: "조직별 행사 목록 조회" })
  @ApiResponse({ status: 200, description: "조직별 행사 목록 조회 성공" })
  async findByOrganization(@Param("organizationId") organizationId: string) {
    return this.eventsService.findByOrganization(organizationId);
  }
}
