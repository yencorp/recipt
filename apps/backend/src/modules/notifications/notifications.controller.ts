import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Put,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationSettingDto } from "./dto/update-notification-setting.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { NotificationType, NotificationStatus } from "../../entities/notification.entity";
import { AdminOnly } from "../auth/roles.decorator";

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "알림 목록 조회 (본인)" })
  @ApiQuery({
    name: "type",
    required: false,
    description: "알림 타입으로 필터링",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "상태로 필터링",
  })
  @ApiQuery({ name: "page", required: false, description: "페이지 번호" })
  @ApiQuery({ name: "limit", required: false, description: "페이지당 개수" })
  @ApiResponse({ status: 200, description: "알림 목록 조회 성공" })
  async findAll(
    @Request() req,
    @Query("type") type?: NotificationType,
    @Query("status") status?: NotificationStatus,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.notificationsService.findAll({
      userId: req.user.id,
      type,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get("unread-count")
  @ApiOperation({ summary: "읽지 않은 알림 개수 조회" })
  @ApiResponse({ status: 200, description: "읽지 않은 알림 개수 조회 성공" })
  async getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Get("settings")
  @ApiOperation({ summary: "알림 설정 조회" })
  @ApiResponse({ status: 200, description: "알림 설정 조회 성공" })
  async getSettings(@Request() req) {
    return this.notificationsService.getSettings(req.user.id);
  }

  @Put("settings")
  @ApiOperation({ summary: "알림 설정 업데이트" })
  @ApiResponse({ status: 200, description: "알림 설정 업데이트 성공" })
  async updateSetting(
    @Request() req,
    @Body() updateDto: UpdateNotificationSettingDto
  ) {
    return this.notificationsService.updateSetting(req.user.id, updateDto);
  }

  @Get(":id")
  @ApiOperation({ summary: "알림 상세 조회" })
  @ApiResponse({ status: 200, description: "알림 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "알림을 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.notificationsService.findOne(id);
  }

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: "알림 생성 (관리자 전용)" })
  @ApiResponse({ status: 201, description: "알림 생성 성공" })
  @ApiResponse({ status: 403, description: "권한 없음" })
  async create(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.create(createDto);
  }

  @Put(":id/read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "알림 읽음 처리" })
  @ApiResponse({ status: 200, description: "알림 읽음 처리 성공" })
  @ApiResponse({ status: 404, description: "알림을 찾을 수 없음" })
  async markAsRead(@Param("id") id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put(":id/unread")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "알림 읽지 않음 처리" })
  @ApiResponse({ status: 200, description: "알림 읽지 않음 처리 성공" })
  @ApiResponse({ status: 404, description: "알림을 찾을 수 없음" })
  async markAsUnread(@Param("id") id: string) {
    return this.notificationsService.markAsUnread(id);
  }

  @Put(":id/archive")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "알림 보관" })
  @ApiResponse({ status: 200, description: "알림 보관 성공" })
  @ApiResponse({ status: 404, description: "알림을 찾을 수 없음" })
  async archive(@Param("id") id: string) {
    return this.notificationsService.archive(id);
  }

  @Put("read-all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "모든 알림 읽음 처리" })
  @ApiResponse({ status: 200, description: "모든 알림 읽음 처리 성공" })
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "알림 삭제" })
  @ApiResponse({ status: 200, description: "알림 삭제 성공" })
  @ApiResponse({ status: 404, description: "알림을 찾을 수 없음" })
  async remove(@Param("id") id: string) {
    return this.notificationsService.remove(id);
  }
}
